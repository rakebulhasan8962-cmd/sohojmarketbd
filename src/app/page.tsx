import { getSiteContent } from "@/lib/data";
import LandingView from "@/components/LandingView";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const content = await getSiteContent();
  return <LandingView content={content} />;
}