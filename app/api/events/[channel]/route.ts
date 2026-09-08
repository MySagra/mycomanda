import { NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME, getAuthToken } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const ALLOWED = new Set(['cashier', 'display', 'printer']);

export async function GET(
  _req: NextRequest,
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

  const abortUpstream = new AbortController();

  let upstream: Response;
  try {
    upstream = await fetch(`${process.env.API_URL}/events/${channel}`, {
      method: 'GET',
      headers: {
        Cookie: `${AUTH_COOKIE_NAME}=${token}`,
        Accept: 'text/event-stream',
        'Cache-Control': 'no-cache',
      },
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
  const stream = new ReadableStream<Uint8Array>({
    async pull(ctrl) {
      try {
        const { value, done } = await reader.read();
        if (done) {
          ctrl.close();
          return;
        }
        if (value) ctrl.enqueue(value);
      } catch (err) {
        console.error('[SSE proxy] read error:', err);
        ctrl.error(err);
      }
    },
    cancel() {
      abortUpstream.abort();
      reader.cancel().catch(() => {});
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
