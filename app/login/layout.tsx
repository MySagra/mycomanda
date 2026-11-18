import { Metadata } from "next";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main>
      {children}
    </main>
  )
}

export const metadata: Metadata = {
  title: "MyComanda - Login",
  description: "Monitor delle comande per la cucina",
};
