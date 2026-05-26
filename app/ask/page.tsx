import type { Metadata } from "next";
import MainChatWorkspace from "@/app/components/main-chat-workspace";

export const metadata: Metadata = {
  title: "Ask Civic Logos | Civic Logos",
  description:
    "Use the Civic Logos main chat workspace to ask read-only ledger questions or structure a pre-ledger candidate for human review.",
};

export const dynamic = "force-dynamic";

export default function AskPage() {
  return <MainChatWorkspace entryPoint="ask" />;
}
