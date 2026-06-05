import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User, { type IUser } from "@/models/User";
import type { UserRole } from "@/types";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          await connectDB();

          const user = await User.findOne({
            email: String(credentials.email).toLowerCase(),
          }).lean() as IUser | null;

          if (!user || !user.password) {
            return null;
          }

          const isValid = await bcrypt.compare(
            String(credentials.password),
            user.password
          );

          if (!isValid) {
            return null;
          }

          return {
            id: (user._id as { toString(): string }).toString(),
            name: user.name,
            email: user.email,
            image: user.image ?? null,
            role: user.role as UserRole,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          await connectDB();

          const existingUser = await User.findOne({
            email: user.email?.toLowerCase(),
          });

          if (existingUser) {
            if (!existingUser.googleId) {
              existingUser.googleId = account.providerAccountId;
              existingUser.image = user.image ?? existingUser.image;
              await existingUser.save();
            }
            user.id = (existingUser._id as { toString(): string }).toString();
            (user as unknown as { role: UserRole }).role = existingUser.role;
          } else {
            const newUser = (await User.create({
              name: user.name ?? "Unknown",
              email: user.email?.toLowerCase() ?? "",
              image: user.image ?? undefined,
              googleId: account.providerAccountId,
              role: "user",
            })) as IUser;
            user.id = (newUser._id as { toString(): string }).toString();
            (user as unknown as { role: UserRole }).role = newUser.role;
          }
        } catch {
          return false;
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = ((user as unknown as { role?: UserRole }).role) ?? "user";
      }
      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
});
