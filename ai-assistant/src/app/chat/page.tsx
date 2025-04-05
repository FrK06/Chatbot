// src/app/chat/page.tsx
import { getCurrentUser } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import ChatInterfaceDirect from "./ChatInterfaceDirect";

export default async function ChatPage() {
  const user = await getCurrentUser();
  
  // If no user, redirect to login
  if (!user) {
    redirect("/simple-test?next=/chat");
  }

  // Render the client component chat interface
  return <ChatInterfaceDirect user={user} />;
}