import TopicCardPage from "../../../components/topic-card-page";
import { institutionalTrustTopic001 } from "../../../lib/civic-logos";

export default function InstitutionalTrustTopic001Page() {
  return (
    <TopicCardPage
      brandSubtitle="Institutional trust topic card"
      card={institutionalTrustTopic001}
      roomHref="/rooms/institutional-trust"
      roomLabel="Trust room"
    />
  );
}
