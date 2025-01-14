import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import Credentials from "next-auth/providers/credentials";
import { signInSchema } from "@/lib/zod";
import { compareSync } from "bcrypt-ts";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login"
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {}
      },
      authorize: async (credentials) => {
        const validatedFields = signInSchema.safeParse(credentials);

        if (!validatedFields.success) {
          return null;
        }

        const { email, password } = validatedFields.data;

        try {
          const user = await prisma.user.findUnique({
            where: { email }
          });

          if (!user || !user.password) {
            throw new Error("No user found");
          }

          const passwordMatch = compareSync(password, user.password);

          if (!passwordMatch) {
            throw new Error("Password does not match");
          }

          return user;
        } catch (error) {
          throw new Error(error.message); // Rethrow the error for clarity
        }
      }
    })
  ],
  callbacks: {
    async authorize({ user }) {
      // Optional: Add additional logic if needed
      return user;
    },
    async session({ session, token }) {
      session.user.id = token.sub;
      session.user.role = token.role;
      return session;
    }
  }
});
