import TopicCardPage from "../../components/topic-card-page";
import { topic001 } from "../../lib/civic-logos";

export default function Topic001Page() {
  return (
    <TopicCardPage
      brandSubtitle="Healthcare topic card"
      card={topic001}
      roomHref="/healthcare"
      roomLabel="Healthcare room"
    />
  );
}
