import { useState, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  Clock,
  Target,
  MapPin,
  Sparkles,
  Car,
  Home,
  Building2,
  Navigation,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { OpportunityCard } from '@/components/dashboard/OpportunityCard';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Opportunity, FilterOptions, DashboardStats, AssetType } from '@/types/opportunity';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { haversineDistance } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

// Mock data for demonstration
const mockOpportunities: Opportunity[] = [
  {
    id: '1',
    asset_type: 'vehicle',
    title: '2019 Toyota Land Cruiser V8',
    description: 'Well-maintained SUV with full service history',
    image_url: null,
    listed_price: 4500000,
    estimated_value: 6200000,
    profit_potential: 1700000,
    profit_percentage: 37.8,
    county: 'Nairobi',
    city: 'Westlands',
    district: 'Westlands',
    seller_name: 'James Mwangi',
    seller_contact: '+254 712 345 678',
    seller_credibility_score: 8.5,
    source_url: 'https://example.com',
    source_platform: 'Cheki',
    improvement_recommendations: [],
    improvement_cost_estimate: 150000,
    net_profit_potential: 1550000,
    ai_confidence_score: 85,
    status: 'new',
    scraped_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    asset_type: 'residential',
    title: '3 Bedroom Apartment in Kilimani',
    description: 'Modern apartment with city views, needs minor renovations',
    image_url: null,
    listed_price: 12000000,
    estimated_value: 15500000,
    profit_potential: 3500000,
    profit_percentage: 29.2,
    county: 'Nairobi',
    city: 'Kilimani',
    district: 'Kilimani',
    seller_name: 'Property Hub Kenya',
    seller_contact: '+254 720 987 654',
    seller_credibility_score: 9.2,
    source_url: 'https://example.com',
    source_platform: 'BuyRentKenya',
    improvement_recommendations: [],
    improvement_cost_estimate: 500000,
    net_profit_potential: 3000000,
    ai_confidence_score: 78,
    status: 'new',
    scraped_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    asset_type: 'commercial',
    title: 'Commercial Space in Mombasa CBD',
    description: 'Prime location for retail or office use',
    image_url: null,
    listed_price: 25000000,
    estimated_value: 32000000,
    profit_potential: 7000000,
    profit_percentage: 28.0,
    county: 'Mombasa',
    city: 'Mombasa',
    district: 'CBD',
    seller_name: 'Coast Properties Ltd',
    seller_contact: '+254 733 456 789',
    seller_credibility_score: 7.8,
    source_url: 'https://example.com',
    source_platform: 'Property24',
    improvement_recommendations: [],
    improvement_cost_estimate: 1000000,
    net_profit_potential: 6000000,
    ai_confidence_score: 72,
    status: 'new',
    scraped_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    asset_type: 'vehicle',
    title: '2020 Mercedes-Benz C200',
    description: 'Low mileage, single owner, excellent condition',
    image_url: null,
    listed_price: 3800000,
    estimated_value: 4800000,
    profit_potential: 1000000,
    profit_percentage: 26.3,
    county: 'Kiambu',
    city: 'Thika',
    district: 'Thika Town',
    seller_name: 'Auto Dealers Kenya',
    seller_contact: '+254 722 111 222',
    seller_credibility_score: 8.0,
    source_url: 'https://example.com',
    source_platform: 'JiJi Kenya',
    improvement_recommendations: [],
    improvement_cost_estimate: 50000,
    net_profit_potential: 950000,
    ai_confidence_score: 88,
    status: 'new',
    scraped_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const mockStats: DashboardStats = {
  totalOpportunities: 156,
  totalPotentialProfit: 45600000,
  newListingsToday: 12,
  averageProfitMargin: 28.5,
  topCounty: 'Nairobi',
  highValueDeals: 23,
};

const counties = [
  'Nairobi', 'Mombasa', 'Kiambu', 'Nakuru', 'Kisumu',
  'Machakos', 'Kajiado', 'Uasin Gishu', 'Kilifi', 'Kwale',
];

// Mock county coords for distance calc
const COUNTY_COORDS: Record<string, { lat: number; lng: number }> = {
  Nairobi: { lat: -1.2921, lng: 36.8219 },
  Mombasa: { lat: -4.0435, lng: 39.6682 },
  Kiambu: { lat: -1.1714, lng: 36.8356 },
  Nakuru: { lat: -0.3031, lng: 36.0800 },
  Kisumu: { lat: -0.1022, lng: 34.7617 },
  Machakos: { lat: -1.5177, lng: 37.2634 },
  Kajiado: { lat: -2.0981, lng: 36.7820 },
  'Uasin Gishu': { lat: 0.5143, lng: 35.2698 },
  Kilifi: { lat: -3.6305, lng: 39.8499 },
  Kwale: { lat: -4.1816, lng: 39.4525 },
};

const CATEGORY_CONFIG: { type: AssetType; label: string; icon: typeof Car }[] = [
  { type: 'vehicle', label: 'Vehicles', icon: Car },
  { type: 'residential', label: 'Residential', icon: Home },
  { type: 'commercial', label: 'Commercial', icon: Building2 },
];

export default function Dashboard() {
  const { profile } = useAuth();
  const [opportunities] = useState<Opportunity[]>(mockOpportunities);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['vehicle', 'residential', 'commercial'])
  );
  const [filters, setFilters] = useState<FilterOptions>({
    assetTypes: [],
    counties: [],
    minProfit: 0,
    maxProfit: 100,
    budgetMin: profile?.budget_min ?? 0,
    budgetMax: profile?.budget_max ?? 999999999,
    maxDistanceKm: profile?.search_radius_km ?? 200,
    status: [],
    sortBy: 'profit',
    sortOrder: 'desc',
  });
  const { toast } = useToast();

  const hasLocation = !!(profile?.user_latitude && profile?.user_longitude);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `KES ${(amount / 1000000).toFixed(1)}M`;
    return `KES ${(amount / 1000).toFixed(0)}K`;
  };

  const handleSave = (id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); toast({ title: 'Removed from saved' }); }
      else { next.add(id); toast({ title: 'Saved to your list' }); }
      return next;
    });
  };

  const handleDismiss = (id: string) => {
    toast({ title: 'Opportunity dismissed' });
  };

  const handleContact = (opportunity: Opportunity) => {
    if (opportunity.seller_contact) window.open(`tel:${opportunity.seller_contact}`);
    toast({ title: 'Opening contact...' });
  };

  const toggleCategory = (type: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  };

  // Filter + sort
  const sortedOpportunities = useMemo(() => {
    const filtered = opportunities.filter((opp) => {
      if (filters.assetTypes.length > 0 && !filters.assetTypes.includes(opp.asset_type)) return false;
      if (filters.counties.length > 0 && !filters.counties.includes(opp.county)) return false;
      if (opp.profit_percentage < filters.minProfit) return false;
      if (opp.listed_price < filters.budgetMin) return false;
      if (filters.budgetMax < 999999999 && opp.listed_price > filters.budgetMax) return false;

      // Distance filter
      if (hasLocation && filters.maxDistanceKm < 200) {
        const coords = COUNTY_COORDS[opp.county];
        if (coords) {
          const dist = haversineDistance(
            profile!.user_latitude!, profile!.user_longitude!,
            coords.lat, coords.lng
          );
          if (dist > filters.maxDistanceKm) return false;
        }
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          opp.title.toLowerCase().includes(q) ||
          opp.county.toLowerCase().includes(q) ||
          opp.description?.toLowerCase().includes(q) ||
          opp.asset_type.toLowerCase().includes(q)
        );
      }
      return true;
    });

    const order = filters.sortOrder === 'desc' ? -1 : 1;
    return [...filtered].sort((a, b) => {
      switch (filters.sortBy) {
        case 'profit': return (b.profit_percentage - a.profit_percentage) * order;
        case 'date': return (new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) * order;
        case 'price': return (a.listed_price - b.listed_price) * order;
        case 'credibility': return ((b.seller_credibility_score || 0) - (a.seller_credibility_score || 0)) * order;
        default: return 0;
      }
    });
  }, [opportunities, filters, searchQuery, hasLocation, profile]);

  // Group by category
  const groupedOpps = useMemo(() => {
    const groups: Record<AssetType, Opportunity[]> = { vehicle: [], residential: [], commercial: [] };
    sortedOpportunities.forEach((o) => groups[o.asset_type]?.push(o));
    return groups;
  }, [sortedOpportunities]);

  // Near you section
  const nearbyOpps = useMemo(() => {
    if (!hasLocation) return [];
    return sortedOpportunities
      .map((o) => {
        const coords = COUNTY_COORDS[o.county];
        if (!coords) return null;
        const dist = haversineDistance(profile!.user_latitude!, profile!.user_longitude!, coords.lat, coords.lng);
        return { ...o, distance: dist };
      })
      .filter(Boolean)
      .sort((a, b) => a!.distance - b!.distance)
      .slice(0, 4) as (Opportunity & { distance: number })[];
  }, [sortedOpportunities, hasLocation, profile]);

  const noBudgetMatch = sortedOpportunities.length === 0 && opportunities.length > 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Discover profitable arbitrage opportunities across Kenya
            </p>
          </div>
          <Badge variant="outline" className="w-fit gap-2">
            <Sparkles className="h-3 w-3 text-primary" />
            AI-Powered Analysis
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Opportunities" value={mockStats.totalOpportunities} icon={Target} variant="primary" trend={{ value: 12, label: 'from last week' }} />
          <StatCard title="Potential Profit" value={formatCurrency(mockStats.totalPotentialProfit)} icon={DollarSign} variant="success" trend={{ value: 8, label: 'from last week' }} />
          <StatCard title="New Today" value={mockStats.newListingsToday} subtitle="listings" icon={Clock} variant="warning" />
          <StatCard title="Avg. Profit Margin" value={`${mockStats.averageProfitMargin}%`} icon={TrendingUp} variant="accent" />
        </div>

        {/* Filters */}
        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          counties={counties}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          hasLocation={hasLocation}
        />

        {/* Budget mismatch banner */}
        {noBudgetMatch && (
          <div className="rounded-lg border border-dashed border-warning bg-warning/5 p-4 text-center">
            <p className="text-sm font-medium">No opportunities in your budget range.</p>
            <p className="text-xs text-muted-foreground">Try adjusting your budget filter above</p>
          </div>
        )}

        {/* Near You Section */}
        {hasLocation && nearbyOpps.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Near You</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {nearbyOpps.map((opp) => (
                <div key={opp.id} className="relative">
                  <Badge className="absolute right-2 top-2 z-10" variant="secondary">
                    {opp.distance.toFixed(0)} km away
                  </Badge>
                  <OpportunityCard
                    opportunity={opp}
                    isSaved={savedIds.has(opp.id)}
                    onSave={handleSave}
                    onDismiss={handleDismiss}
                    onContact={handleContact}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Categorized Sections */}
        <div className="space-y-4">
          {CATEGORY_CONFIG.map(({ type, label, icon: Icon }) => {
            const items = groupedOpps[type];
            const isExpanded = expandedCategories.has(type);
            return (
              <Collapsible key={type} open={isExpanded} onOpenChange={() => toggleCategory(type)}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="flex w-full items-center justify-between rounded-lg border bg-card p-4 hover:bg-accent/50">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-primary" />
                      <span className="text-lg font-semibold">{label}</span>
                      <Badge variant="secondary">{items.length}</Badge>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  {items.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {items.map((opportunity) => (
                        <OpportunityCard
                          key={opportunity.id}
                          opportunity={opportunity}
                          isSaved={savedIds.has(opportunity.id)}
                          onSave={handleSave}
                          onDismiss={handleDismiss}
                          onContact={handleContact}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-8">
                      <MapPin className="h-8 w-8 text-muted-foreground/50" />
                      <p className="mt-2 text-sm text-muted-foreground">No {label.toLowerCase()} in current filters</p>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
