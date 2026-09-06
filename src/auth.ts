import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { findUserByEmail } from '@/lib/userStore';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = (credentials.email as string).toLowerCase().trim();
        const password = credentials.password as string;

        // 1. Try Prisma lookup if PostgreSQL is reachable
        try {
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (user && user.password) {
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (isValidPassword) {
              return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                studentId: user.studentId,
              };
            }
          }
        } catch (error) {
          // Gracefully continue to fallback store if PostgreSQL is unreachable
          console.warn('Database server currently offline on localhost:5432. Authenticating via fallback store...');
        }

        // 2. Check registered accounts & demo users in fallback store
        const fallbackUser = findUserByEmail(email);
        if (fallbackUser && fallbackUser.password) {
          let isValid = false;
          if (fallbackUser.password.startsWith('$2')) {
            isValid = await bcrypt.compare(password, fallbackUser.password);
          } else {
            isValid = fallbackUser.password === password;
          }

          if (isValid) {
            return {
              id: fallbackUser.id,
              name: fallbackUser.name,
              email: fallbackUser.email,
              role: fallbackUser.role,
              studentId: fallbackUser.studentId || undefined,
            };
          }
        }

        // 3. Fallback for admin demo
        if (email === 'admin@campus.edu' && password === 'password123') {
          return {
            id: 'demo-admin-system',
            name: 'System Admin',
            email: 'admin@campus.edu',
            role: 'ADMIN',
            studentId: 'ADM-001',
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.studentId = (user as any).studentId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).studentId = token.studentId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.AUTH_SECRET || 'campusfind-auth-secret-key-32chars-min-ok',
});
