import { NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME, getAuthToken } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const ALLOWED = new Set(['cashier', 'display', 'printer', 'ticket']);

/**
 * Cloudflare Tunnel re-chunks the upstream body at arbitrary byte offsets, so a
 * single SSE event can arrive split across several reads (and a multi-byte UTF-8
 * character can be split in half). This proxy therefore decodes incrementally and
 * only forwards whole `\n\n`-terminated frames downstream. It also emits its own
 * keep-alive comments so the tunnel never sees an idle connection.
 */
const KEEPALIVE_MS = 15_000;
const FRAME_SEPARATOR = /\r\n\r\n|\n\n|\r\r/;

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ channel: string }> },
) {
  const token = await getAuthToken();
  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { channel } = await ctx.params;
  if (!ALLOWED.has(channel)) {
    return new Response('Invalid channel', { status: 400 });
  }

  // Resume support: the browser sends Last-Event-ID on its own reconnects, the
  // client watchdog passes it as a query param when it recreates the stream.
  const lastEventId =
    req.headers.get('last-event-id') ?? req.nextUrl.searchParams.get('lastEventId');

  const abortUpstream = new AbortController();

  const upstreamHeaders: Record<string, string> = {
    Cookie: `${AUTH_COOKIE_NAME}=${token}`,
    Accept: 'text/event-stream',
    'Cache-Control': 'no-cache',
    // Compression buffers whole blocks and defeats streaming through the tunnel.
    'Accept-Encoding': 'identity',
  };
  if (lastEventId) upstreamHeaders['Last-Event-ID'] = lastEventId;

  let upstream: Response;
  try {
    upstream = await fetch(`${process.env.API_URL}/events/${channel}`, {
      method: 'GET',
      headers: upstreamHeaders,
      signal: abortUpstream.signal,
      cache: 'no-store',
    });
  } catch (err) {
    console.error('[SSE proxy] upstream fetch failed:', err);
    return new Response('Upstream unavailable', { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => '');
    console.error(`[SSE proxy] upstream status ${upstream.status}: ${text}`);
    return new Response(text || 'Upstream error', { status: upstream.status || 502 });
  }

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder('utf-8');
  const encoder = new TextEncoder();
  let buffer = '';
  let keepalive: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream<Uint8Array>({
    start(ctrl) {
      // Tell the browser how fast to retry, and flush the response headers now
      // so the tunnel opens the downstream connection immediately.
      ctrl.enqueue(encoder.encode('retry: 3000\n\n'));

      // A named event, not an SSE comment: the browser drops comments without
      // firing anything, so the client watchdog would never see the heartbeat.
      keepalive = setInterval(() => {
        try {
          ctrl.enqueue(encoder.encode('event: keepalive\ndata: 1\n\n'));
        } catch {
          clearInterval(keepalive);
        }
      }, KEEPALIVE_MS);

      // Client navigated away or the watchdog closed the EventSource.
      req.signal.addEventListener('abort', () => {
        clearInterval(keepalive);
        abortUpstream.abort();
        reader.cancel().catch(() => {});
      });
    },

    async pull(ctrl) {
      try {
        const { value, done } = await reader.read();

        if (done) {
          buffer += decoder.decode();
          // Forward a trailing frame that arrived without its final blank line.
          const tail = buffer.trim();
          if (tail) ctrl.enqueue(encoder.encode(`${tail.replace(/\r\n/g, '\n')}\n\n`));
          buffer = '';
          clearInterval(keepalive);
          ctrl.close();
          return;
        }

        if (!value) return;

        // stream: true keeps a partial multi-byte character in the decoder until
        // the rest of its bytes arrive in a later chunk.
        buffer += decoder.decode(value, { stream: true });

        const frames: string[] = [];
        let match: RegExpMatchArray | null;
        while ((match = buffer.match(FRAME_SEPARATOR)) !== null) {
          const end = match.index! + match[0].length;
          const frame = buffer.slice(0, match.index!);
          buffer = buffer.slice(end);
          if (frame.length > 0) frames.push(frame.replace(/\r\n/g, '\n'));
        }

        if (frames.length > 0) {
          ctrl.enqueue(encoder.encode(`${frames.join('\n\n')}\n\n`));
        }
      } catch (err) {
        clearInterval(keepalive);
        console.error('[SSE proxy] read error:', err);
        ctrl.error(err);
      }
    },

    cancel() {
      clearInterval(keepalive);
      abortUpstream.abort();
      reader.cancel().catch(() => {});
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, no-transform, must-revalidate',
      'Content-Encoding': 'identity',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
