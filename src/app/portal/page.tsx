'use client'

import { SessionProvider } from "next-auth/react"
import { Client } from "~/components/Client"

export default function page() {
    return (
        <SessionProvider>
            <Client />
        </SessionProvider>
    )
}