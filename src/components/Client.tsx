'use client'
import { SessionProvider, useSession } from "next-auth/react"
import { redirect } from "next/navigation";


export function Client() {
    const { data: session, status } = useSession({
        required: true,
        onUnauthenticated() {
            redirect('/api/auth/signin');
        }
    })
    if (status === 'loading') return <div>Loading</div>
    return (
        <SessionProvider>
            <div>
                <h1>Client Side</h1>
                <h3>Session : {JSON.stringify(session)}</h3>
                <h3>Status: {status}</h3>
            </div>
        </SessionProvider>
    )
}