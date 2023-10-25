import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import CredentialsProvider from "next-auth/providers/credentials"

import { env } from "~/env.mjs";

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
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  callbacks: {
    async jwt({ token, account, session, user }) {
      // Persist the OAuth access_token to the token right after signin
      if (account) token.accessToken = account.accessToken
      // if (Date.now() < token.accessToken) {
      //   const res = await fetch("http://localhost:8081/login", {
      //     method: 'POST',
      //     body: JSON.stringify({
      //       email: account
      //     }),
      //     headers: { "Content-Type": "application/json" }
      //   })
      // }
      console.log("---------JWT----------");
      console.log(token);
      console.log(account);
      console.log(session);
      console.log(user);
      console.log("---------END JWT----------");
      return token
    },
    async session({ session, token, user }) {
      // Send properties to the client, like an access_token from a provider.
      console.log("---------SESSION----------");
      console.log(session);
      console.log(token);
      console.log(user);
      console.log("---------END SESSION----------");
      return {
        ...session,
        accessToken: token.accessToken
      }
    }
  },
  session: {
    maxAge: 60
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
        const res = await fetch("http://localhost:8081/login", {
          method: 'POST',
          body: JSON.stringify({
            email: credentials?.username
          }),
          headers: { "Content-Type": "application/json" }
        })

        const user = await res.json()
        console.log(user);
        // If no error and we have user data, return it
        if (res.ok && user) {
          return user
        }
        // Return null if user data could not be retrieved
        return null
      }
    })
  ],
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = () => getServerSession(authOptions);
