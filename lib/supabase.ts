import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://csgcygbvmsikbczmsajj.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

// Server-side client with service role key for admin operations
// Use service role key if available, otherwise fall back to anon key
export const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export interface MedicalBill {
  patient_name?: string;
  patient_dob?: string;
  provider_name?: string;
  provider_address?: string;
  service_date?: string;
  total_amount?: number;
  items?: Array<{
    description: string;
    amount: number;
    date?: string;
  }>;
  billing_address?: string;
  account_number?: string;
}

export async function saveMedicalBill(
  rawOcrText: string,
  structuredData: MedicalBill,
  reason?: string | null
) {
  const { data, error } = await supabaseAdmin
    .from("medical_bills")
    .insert({
      raw_ocr_text: rawOcrText,
      structured_data: structuredData,
      patient_name: structuredData.patient_name || null,
      patient_dob: structuredData.patient_dob || null,
      provider_name: structuredData.provider_name || null,
      provider_address: structuredData.provider_address || null,
      service_date: structuredData.service_date || null,
      total_amount: structuredData.total_amount || null,
      items: structuredData.items || null,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Automatically create a crowdfunding campaign for this bill
  const goalAmount = structuredData.total_amount || 0;
  if (goalAmount > 0) {
    console.log("Creating campaign with reason:", reason);
    const { error: campaignError } = await supabaseAdmin
      .from("crowdfunding_campaigns")
      .insert({
        medical_bill_id: data.id,
        goal_amount: goalAmount,
        amount_raised: 0,
        is_funded: false,
        reason: reason || null,
      });

    if (campaignError) {
      console.error("Failed to create crowdfunding campaign:", campaignError);
      // Don't throw - bill is saved, campaign creation is secondary
    }
  }

  return data;
}

export interface CrowdfundingCampaign {
  id: string;
  medical_bill_id: string;
  goal_amount: number;
  amount_raised: number;
  is_funded: boolean;
  reason?: string | null;
  created_at: string;
  updated_at: string;
  medical_bills?: {
    patient_name?: string;
    provider_name?: string;
    total_amount?: number;
    service_date?: string;
  };
}

export async function getCrowdfundingCampaigns(isFunded?: boolean) {
  let query = supabaseAdmin
    .from("crowdfunding_campaigns")
    .select(`
      *,
      medical_bills (
        patient_name,
        provider_name,
        total_amount,
        service_date
      )
    `)
    .order("created_at", { ascending: false });

  if (isFunded !== undefined) {
    query = query.eq("is_funded", isFunded);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data as CrowdfundingCampaign[];
}

