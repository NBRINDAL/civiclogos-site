import type { Metadata } from "next";
import MainChatWorkspace from "./components/main-chat-workspace";

export const metadata: Metadata = {
  title: "Civic Logos | Chat-first public reasoning",
  description:
    "Ask the live Civic Logos ledger in plain language, inspect the public record, and submit pre-ledger candidate challenges without letting AI move the public record.",
};

export const dynamic = "force-dynamic";

export default function HomePage() {
  return <MainChatWorkspace entryPoint="root" />;
}
