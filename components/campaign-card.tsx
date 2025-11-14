"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, DollarSign, Calendar, Building2, Sparkles } from "lucide-react";
import { AIChatModal } from "./ai-chat-modal";
import type { CrowdfundingCampaign } from "@/lib/supabase";

interface CampaignCardProps {
  campaign: CrowdfundingCampaign;
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const progress = campaign.goal_amount > 0 
    ? (campaign.amount_raised / campaign.goal_amount) * 100 
    : 0;
  const bill = campaign.medical_bills;

  return (
    <>
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="text-lg">
            {bill?.patient_name || "Anonymous"}
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
            <Building2 className="h-4 w-4" />
            <span>{bill?.provider_name || "Medical Provider"}</span>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Raised</span>
                <span className="font-semibold">
                  ${campaign.amount_raised.toLocaleString()} of ${campaign.goal_amount.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {progress.toFixed(1)}% funded
              </p>
            </div>

            {/* Campaign Details */}
            <div className="space-y-2 text-sm">
              {bill?.service_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Service Date: {new Date(bill.service_date).toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Bill Amount: ${bill?.total_amount?.toLocaleString() || "N/A"}
                </span>
              </div>
            </div>

            {/* Reason/Story */}
            {campaign.reason && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {campaign.reason}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 mt-auto">
              <Button className="w-full">
                <Heart className="h-4 w-4 mr-2" />
                Contribute
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setIsAIModalOpen(true)}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Ask AI about the patient
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AIChatModal
        campaignId={campaign.id}
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
      />
    </>
  );
}

