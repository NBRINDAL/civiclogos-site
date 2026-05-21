import { notFound } from "next/navigation";
import TopicCardPage from "../../../components/topic-card-page";
import {
  getRoomHref,
  getRoomTopicBrandSubtitle,
  getRoomTopicCard,
  getRoomTopicCards,
  getRoomTopicLabel,
  issueRooms,
  type IssueRoomSlug,
} from "../../../lib/civic-logos";

export function generateStaticParams() {
  return (Object.keys(issueRooms) as IssueRoomSlug[])
    .filter((slug) => slug !== "healthcare")
    .flatMap((slug) =>
      getRoomTopicCards(slug).map((card) => ({
        slug,
        topicId: card.id,
      })),
    );
}

export default async function IssueRoomTopicPage({
  params,
}: {
  params: Promise<{ slug: string; topicId: string }>;
}) {
  const { slug, topicId } = await params;
  const roomSlug = slug as IssueRoomSlug;

  if (!(roomSlug in issueRooms) || roomSlug === "healthcare") {
    notFound();
  }

  const card = getRoomTopicCard(roomSlug, topicId);

  if (!card) {
    notFound();
  }

  return (
    <TopicCardPage
      brandSubtitle={getRoomTopicBrandSubtitle(roomSlug)}
      card={card}
      roomHref={getRoomHref(roomSlug)}
      roomLabel={getRoomTopicLabel(roomSlug)}
    />
  );
}
