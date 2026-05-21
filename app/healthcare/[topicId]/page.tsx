import { notFound } from "next/navigation";
import TopicCardPage from "../../components/topic-card-page";
import {
  getRoomHref,
  getRoomTopicBrandSubtitle,
  getRoomTopicCard,
  getRoomTopicCards,
  getRoomTopicLabel,
} from "../../lib/civic-logos";

export function generateStaticParams() {
  return getRoomTopicCards("healthcare").map((card) => ({ topicId: card.id }));
}

export default async function HealthcareTopicPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;
  const card = getRoomTopicCard("healthcare", topicId);

  if (!card) {
    notFound();
  }

  return (
    <TopicCardPage
      brandSubtitle={getRoomTopicBrandSubtitle("healthcare")}
      card={card}
      roomHref={getRoomHref("healthcare")}
      roomLabel={getRoomTopicLabel("healthcare")}
    />
  );
}
