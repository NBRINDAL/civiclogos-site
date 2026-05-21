import TopicCardPage from "../../../components/topic-card-page";
import { governanceTopic001 } from "../../../lib/civic-logos";

export default function GovernanceTopic001Page() {
  return (
    <TopicCardPage
      brandSubtitle="Governance topic card"
      card={governanceTopic001}
      roomHref="/rooms/governance"
      roomLabel="Governance room"
    />
  );
}
