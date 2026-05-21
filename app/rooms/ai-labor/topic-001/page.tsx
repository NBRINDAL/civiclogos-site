import TopicCardPage from "../../../components/topic-card-page";
import { aiTopic001 } from "../../../lib/civic-logos";

export default function AiTopic001Page() {
  return (
    <TopicCardPage
      brandSubtitle="AI topic card"
      card={aiTopic001}
      roomHref="/rooms/ai-labor"
      roomLabel="AI room"
    />
  );
}
