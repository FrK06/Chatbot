// src/app/chat/page.tsx
import { getCurrentUser } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import ChatInterface from "./ChatInterface";

export default async function ChatPage() {
  const user = await getCurrentUser();
  
  // If no user, redirect to login
  if (!user) {
    redirect("/direct-login?next=/chat");
  }

  // Render the client component chat interface
  return <ChatInterface user={user} />;
}