export function EnvChecker() {

    return (
        <div>
            {/* <div>NODE_ENV: {process.env.NODE_ENV}</div> */}
            <div>NEXTAUTH_SECRET: {process.env.NEXTAUTH_SECRET}</div>
            <div>NEXTAUTH_URL: {process.env.NEXTAUTH_URL}</div>
        </div>
    )
}