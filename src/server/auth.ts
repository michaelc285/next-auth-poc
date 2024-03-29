import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
  type DefaultUser,

} from "next-auth";
import { JWT } from "next-auth/jwt"

import CredentialsProvider from "next-auth/providers/credentials"

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      auth: any;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    accessToken: string,
  }
  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }

}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    /** OpenID ID Token */
    auth: {
      accessTokenExpiresAt: number,
      refreshToken: string
    }
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  debug: true,
  callbacks: {
    async jwt(ctx) {
      // console.log("---------JWT----------");
      // console.log(ctx);
      // console.log("---------END JWT----------");
      let { token, user } = ctx;
      if (user) {
        const accessTokenPayload = decode(user?.accessToken ?? "");
        const accessTokenExp = accessTokenPayload.exp;
        return {
          ...token,
          accessToken: user?.accessToken ?? "",
          auth: { ...user, accessTokenExpiresAt: accessTokenExp },
        }
      } else if ((Date.now()) < (token?.auth.accessTokenExpiresAt as number) * 1000) {
        return token;
      } else {
        console.log("---REFRESH TOKEN START---")
        try {
          const res = await refreshToken(token?.email ?? "", token?.auth?.refreshToken ?? "");
          if (!res) throw Error("REFRESH TOKEN EXPIRED");
          const accessTokenPayload = decode(res?.accessToken ?? "");
          const accessTokenExp = accessTokenPayload.exp;
          const result = {
            ...token,
            accessToken: res.accessToken,
            auth: { ...res, accessTokenExpiresAt: accessTokenExp }
          }
          console.log(result);
          console.log("---REFRESH TOKEN END----")
          return result
        } catch (err) {
          console.error(err);
        }
      }
      return token;
    },
    async session(ctx) {
      // Send properties to the client, like an access_token from a provider.
      // console.log("---------SESSION----------");
      // console.log(ctx);
      // console.log("---------END SESSION----------");
      const { session, token } = ctx;
      // console.log(session);
      return {
        ...session,
        auth: token
      }
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 600
  },
  jwt: {
    maxAge: 30 // exp - iat
  },
  providers: [
    CredentialsProvider({
      // The name to display on the sign in form (e.g. 'Sign in with...')
      name: 'Credentials',
      // The credentials is used to generate a suitable form on the sign in page.
      // You can specify whatever fields you are expecting to be submitted.
      // e.g. domain, username, password, 2FA token, etc.
      // You can pass any HTML attribute to the <input> tag through the object.
      credentials: {
        username: { label: "Username", type: "text", placeholder: "jsmith" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        // You need to provide your own logic here that takes the credentials
        // submitted and returns either a object representing a user or value
        // that is false/null if the credentials are invalid.
        // e.g. return { id: 1, name: 'J Smith', email: 'jsmith@example.com' }
        // You can also use the `req` object to obtain additional parameters
        // (i.e., the request IP address)
        const user = await login(credentials?.username ?? "");
        if (user) {
          return { ...user }
        }
        return null
      }
    })
  ],
};

const login = async (email: string) => {
  const res = await fetch("http://localhost:8081/login", {
    method: 'POST',
    body: JSON.stringify({
      email: email
    }),
    headers: { "Content-Type": "application/json" }
  })
  if (res.ok) return await res.json();
  return null;
}

const refreshToken = async (email: string, refreshToken: string) => {
  const res = await fetch("http://localhost:8081/refresh", {
    method: 'POST',
    body: JSON.stringify({
      email: email,
      token: refreshToken
    }),
    headers: { "Content-Type": "application/json" }
  })
  if (res.ok) return await res.json();
  return null;
}

const decode = (token: string) => JSON.parse(Buffer.from(token.split(".")[1] ?? "", 'base64').toString())

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = () => getServerSession(authOptions);
