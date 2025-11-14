import { Card, CardContent } from "@/components/ui/card";
import { getCrowdfundingCampaigns, type CrowdfundingCampaign } from "@/lib/supabase";
import { Heart } from "lucide-react";
import { CampaignCard } from "@/components/campaign-card";

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';

export default async function CrowdfundingPage() {
  // Fetch campaigns that are not yet funded
  let campaigns: CrowdfundingCampaign[] = [];
  try {
    campaigns = await getCrowdfundingCampaigns(false);
    console.log("Fetched campaigns:", campaigns.length);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-foreground">CrowdHealth</h1>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                Home
              </a>
              <a href="/crowdfunding" className="text-sm font-medium text-foreground">
                Crowdfunding
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Crowdfunding Campaigns</h1>
          <p className="text-muted-foreground">
            Help support medical bills that need funding
          </p>
        </div>

        {campaigns.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Active Campaigns</h3>
              <p className="text-muted-foreground">
                There are currently no campaigns waiting for funding.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

