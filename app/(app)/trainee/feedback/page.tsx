"use client";

import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/ui";
import { FeedbackFeed } from "@/components/FeedbackFeed";

export default function TraineeFeedback() {
  const { data, me } = useStore();
  if (!me) return null;
  const mine = data.feedback.filter((f) => f.employeeId === me.id);
  const location = data.feedback.filter((f) => f.locationId === me.locationId && f.employeeId !== me.id && f.source !== "GM note" && f.source !== "Owner note").slice(0, 6);
  return (
    <div className="max-w-3xl">
      <PageHeader title="Feedback" sub="Notes from your manager and what guests are saying. Your tailored training is built from these." />
      <h2 className="eyebrow mb-2">About you</h2>
      <FeedbackFeed items={mine} mode="trainee" />
      <h2 className="eyebrow mb-2 mt-8">Recent guest reviews at your location</h2>
      <FeedbackFeed items={location} mode="trainee" />
    </div>
  );
}
