import { notFound } from "next/navigation";
import TopicCardPage from "../../components/topic-card-page";
import {
  getRoomHref,
  getRoomTopicBrandSubtitle,
  getRoomTopicCard,
  getRoomTopicHref,
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
  const roomCards = getRoomTopicCards("healthcare");
  const currentTopicIndex = roomCards.findIndex((item) => item.id === topicId);

  if (!card || currentTopicIndex === -1) {
    notFound();
  }

  return (
    <TopicCardPage
      brandSubtitle={getRoomTopicBrandSubtitle("healthcare")}
      card={card}
      currentTopicIndex={currentTopicIndex}
      roomHref={getRoomHref("healthcare")}
      roomCards={roomCards.map((item) => ({
        id: item.id,
        title: item.title,
        href: getRoomTopicHref("healthcare", item.id),
      }))}
      roomLabel={getRoomTopicLabel("healthcare")}
    />
  );
}
