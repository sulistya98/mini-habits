import type { NextAuthConfig } from 'next-auth';
 
export const authConfig = {
  trustHost: true,
  pages: {
    signIn: '/login',
    newUser: '/register',
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/') && !nextUrl.pathname.startsWith('/login') && !nextUrl.pathname.startsWith('/register');
      
      // Allow public access to login/register
      if (nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register')) {
        if (isLoggedIn) return Response.redirect(new URL('/', nextUrl));
        return true;
      }

      // Protect all other routes
      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;
