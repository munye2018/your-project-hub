export type AssetType = 'vehicle' | 'residential' | 'commercial';

export type OpportunityStatus = 'new' | 'contacted' | 'negotiating' | 'closed' | 'dismissed';

export type SubscriptionTier = 'free' | 'basic' | 'standard' | 'hustler';

export interface Opportunity {
  id: string;
  asset_type: AssetType;
  title: string;
  description: string | null;
  image_url: string | null;
  listed_price: number;
  estimated_value: number;
  profit_potential: number;
  profit_percentage: number;
  county: string;
  city: string | null;
  district: string | null;
  seller_name: string | null;
  seller_contact: string | null;
  seller_credibility_score: number | null;
  source_url: string | null;
  source_platform: string | null;
  improvement_recommendations: ImprovementRecommendation[];
  improvement_cost_estimate: number;
  net_profit_potential: number;
  ai_confidence_score: number | null;
  status: OpportunityStatus;
  scraped_at: string;
  created_at: string;
  updated_at: string;
}

export interface ImprovementRecommendation {
  item: string;
  description: string;
  estimated_cost: number;
  potential_value_add: number;
  priority: 'low' | 'medium' | 'high';
}

export interface SavedOpportunity {
  id: string;
  user_id: string;
  opportunity_id: string;
  notes: string | null;
  created_at: string;
  opportunity?: Opportunity;
}

export interface RegionalPricing {
  id: string;
  county: string;
  city: string | null;
  district: string | null;
  asset_type: AssetType;
  asset_category: string | null;
  average_price: number;
  min_price: number | null;
  max_price: number | null;
  sample_size: number;
  last_updated: string;
  created_at: string;
}

export interface KenyaCounty {
  id: string;
  name: string;
  code: string;
  capital: string | null;
  population: number | null;
  area_km2: number | null;
  created_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: 'user' | 'admin';
  preferred_regions: string[];
  preferred_asset_types: AssetType[];
  alert_frequency: 'instant' | 'daily' | 'weekly';
  whatsapp_number: string | null;
  notifications_enabled: boolean;
  sound_enabled: boolean;
  push_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  opportunity_id: string | null;
  type: 'new_opportunity' | 'price_drop' | 'high_value' | 'system';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface UserCredits {
  id: string;
  user_id: string;
  credits_remaining: number;
  credits_used_this_month: number;
  subscription_tier: SubscriptionTier;
  subscription_started_at: string;
  created_at: string;
  updated_at: string;
}

export interface OpportunityReveal {
  id: string;
  user_id: string;
  opportunity_id: string;
  revealed_at: string;
  credits_spent: number;
}

export interface DashboardStats {
  totalOpportunities: number;
  totalPotentialProfit: number;
  newListingsToday: number;
  averageProfitMargin: number;
  topCounty: string;
  highValueDeals: number;
}

export interface FilterOptions {
  assetTypes: AssetType[];
  counties: string[];
  minProfit: number;
  maxProfit: number;
  status: OpportunityStatus[];
  sortBy: 'profit' | 'date' | 'price' | 'credibility';
  sortOrder: 'asc' | 'desc';
}
