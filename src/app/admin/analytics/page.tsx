import { getAnalytics } from "@/app/actions/analytics";
import { AnalyticsDashboard } from "./AnalyticsDashboard";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const data = await getAnalytics();
  return <AnalyticsDashboard data={data} />;
}
