import { Metadata } from "next";

// MyCassa's font: Tailwind 4.2's default stack, which MyCassa falls back to.
// Tailwind 4.3 (used here) falls back to a different stack, led by Noto Sans.
const MYCASSA_FONT =
  "font-[ui-sans-serif,system-ui,sans-serif,'Apple_Color_Emoji','Segoe_UI_Emoji','Segoe_UI_Symbol','Noto_Color_Emoji']";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className={MYCASSA_FONT}>
      {children}
    </main>
  )
}

export const metadata: Metadata = {
  title: "MyComanda - Login",
  description: "Monitor delle comande per la cucina",
};
