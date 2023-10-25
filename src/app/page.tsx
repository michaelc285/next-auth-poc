import { SessionProvider } from "next-auth/react";
import Link from "next/link";
import { Client } from "~/components/Client";
import { getServerAuthSession } from "~/server/auth";
export default async function HomePage() {
  const session = await getServerAuthSession()
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      {JSON.stringify(session, null, 5)}
    </main>
  );
}
