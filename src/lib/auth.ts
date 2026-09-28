import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { DEFAULT_CATEGORIES } from "@/lib/utils";

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
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const existing = await prisma.user.findUnique({
          where: { email: user.email },
        });
        if (!existing) {
          // Create the user
          const newUser = await prisma.user.create({
            data: {
              email: user.email,
              name: user.name || user.email.split("@")[0],
              password: "",
              defaultSetupCompleted: true,
            },
          });
          user.id = newUser.id;

          // Create default categories (same as email registration)
          for (const cat of DEFAULT_CATEGORIES) {
            const parent = await prisma.category.create({
              data: {
                userId: newUser.id,
                name: cat.name,
                type: cat.type,
                icon: cat.icon,
                color: cat.color,
                isDefault: true,
              },
            });
            for (const sub of cat.subcategories) {
              await prisma.category.create({
                data: {
                  userId: newUser.id,
                  name: sub,
                  type: cat.type,
                  parentId: parent.id,
                  isDefault: true,
                },
              });
            }
          }

          // Create default accounts
          await prisma.account.createMany({
            data: [
              { userId: newUser.id, name: "Cash", type: "cash", color: "#10b981", icon: "💵" },
              { userId: newUser.id, name: "Bank Account", type: "bank", color: "#3b82f6", icon: "🏦" },
              { userId: newUser.id, name: "Savings Account", type: "savings", color: "#8b5cf6", icon: "💰" },
              { userId: newUser.id, name: "Credit Card", type: "credit_card", color: "#ef4444", icon: "💳" },
              { userId: newUser.id, name: "UPI", type: "upi", color: "#f59e0b", icon: "📱" },
            ],
          });
        } else {
          user.id = existing.id;

          // Seed categories/accounts for existing Google users using the new flag
          if (!existing.defaultSetupCompleted) {
            for (const cat of DEFAULT_CATEGORIES) {
              const parent = await prisma.category.create({
                data: {
                  userId: existing.id,
                  name: cat.name,
                  type: cat.type,
                  icon: cat.icon,
                  color: cat.color,
                  isDefault: true,
                },
              });
              for (const sub of cat.subcategories) {
                await prisma.category.create({
                  data: {
                    userId: existing.id,
                    name: sub,
                    type: cat.type,
                    parentId: parent.id,
                    isDefault: true,
                  },
                });
              }
            }

            await prisma.account.createMany({
              data: [
                { userId: existing.id, name: "Cash", type: "cash", color: "#10b981", icon: "💵" },
                { userId: existing.id, name: "Bank Account", type: "bank", color: "#3b82f6", icon: "🏦" },
                { userId: existing.id, name: "Savings Account", type: "savings", color: "#8b5cf6", icon: "💰" },
                { userId: existing.id, name: "Credit Card", type: "credit_card", color: "#ef4444", icon: "💳" },
                { userId: existing.id, name: "UPI", type: "upi", color: "#f59e0b", icon: "📱" },
              ],
            });

            // Mark setup as completed so it never runs again
            await prisma.user.update({
              where: { id: existing.id },
              data: { defaultSetupCompleted: true },
            });
          }
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
