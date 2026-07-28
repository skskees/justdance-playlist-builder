import NextAuth from "next-auth"; 
import { authOptions } from "../../../../lib/auth";

// Fix Webpack ESM wrapper nesting NextAuth inside a .default property
const authHandler = NextAuth.default || NextAuth;

const handler = authHandler(authOptions);

export { handler as GET, handler as POST };
