import { handlers } from "@/auth"; // Alias @/ might not work if not configured, use relative path if needed? 
// Checking package.json... tsconfig likely supports @/ alias to root.
// If it fails, I will change to relative path "../../../../../auth" which is ugly.
// Standard Next.js templates use @/.
export const { GET, POST } = handlers;
