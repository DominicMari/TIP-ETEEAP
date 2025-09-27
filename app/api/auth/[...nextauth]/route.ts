import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    /**
     * ✅ This callback is now updated to allow any Google user to sign in.
     * It no longer checks against an ADMIN_EMAILS list.
     */
    async signIn({ account, profile }) {
      // We only allow sign-ins from the Google provider.
      if (account?.provider === "google") {
        // You can add a check here to ensure the user has a verified email, if desired.
        // if (profile?.email_verified) {
        //   return true;
        // }
        
        // Return true to allow any Google user to proceed.
        return true;
      }
      
      // Return false to block sign-ins from any other provider.
      return false;
    },
    
    // The jwt and session callbacks are needed to pass the user ID correctly.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };