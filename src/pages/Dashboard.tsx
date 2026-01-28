import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { OpportunityCard } from '@/components/dashboard/OpportunityCard';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Opportunity, FilterOptions, DashboardStats } from '@/types/opportunity';
import { useToast } from '@/hooks/use-toast';

// Mock data for demonstration
const mockOpportunities: Opportunity[] = [
  {
    id: '1',
    asset_type: 'vehicle',
    title: '2019 Toyota Land Cruiser V8',
    description: 'Well-maintained SUV with full service history',
    image_url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400',
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
    image_url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400',
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
    image_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400',
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
    image_url: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400',
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
  'Nairobi',
  'Mombasa',
  'Kiambu',
  'Nakuru',
  'Kisumu',
  'Machakos',
  'Kajiado',
  'Uasin Gishu',
  'Kilifi',
  'Kwale',
];

export default function Dashboard() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(mockOpportunities);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    assetTypes: [],
    counties: [],
    minProfit: 0,
    maxProfit: 100,
    status: [],
    sortBy: 'profit',
    sortOrder: 'desc',
  });
  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `KES ${(amount / 1000000).toFixed(1)}M`;
    }
    return `KES ${(amount / 1000).toFixed(0)}K`;
  };

  const handleSave = (id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast({ title: 'Removed from saved' });
      } else {
        next.add(id);
        toast({ title: 'Saved to your list' });
      }
      return next;
    });
  };

  const handleDismiss = (id: string) => {
    setOpportunities((prev) => prev.filter((o) => o.id !== id));
    toast({ title: 'Opportunity dismissed' });
  };

  const handleContact = (opportunity: Opportunity) => {
    if (opportunity.seller_contact) {
      window.open(`tel:${opportunity.seller_contact}`);
    }
    toast({ title: 'Opening contact...' });
  };

  // Filter opportunities
  const filteredOpportunities = opportunities.filter((opp) => {
    if (filters.assetTypes.length > 0 && !filters.assetTypes.includes(opp.asset_type)) {
      return false;
    }
    if (filters.counties.length > 0 && !filters.counties.includes(opp.county)) {
      return false;
    }
    if (opp.profit_percentage < filters.minProfit) {
      return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        opp.title.toLowerCase().includes(query) ||
        opp.county.toLowerCase().includes(query) ||
        opp.city?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Sort opportunities
  const sortedOpportunities = [...filteredOpportunities].sort((a, b) => {
    const order = filters.sortOrder === 'desc' ? -1 : 1;
    switch (filters.sortBy) {
      case 'profit':
        return (b.profit_percentage - a.profit_percentage) * order;
      case 'date':
        return (new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) * order;
      case 'price':
        return (a.listed_price - b.listed_price) * order;
      case 'credibility':
        return ((b.seller_credibility_score || 0) - (a.seller_credibility_score || 0)) * order;
      default:
        return 0;
    }
  });

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
          <StatCard
            title="Total Opportunities"
            value={mockStats.totalOpportunities}
            icon={Target}
            variant="primary"
            trend={{ value: 12, label: 'from last week' }}
          />
          <StatCard
            title="Potential Profit"
            value={formatCurrency(mockStats.totalPotentialProfit)}
            icon={DollarSign}
            variant="success"
            trend={{ value: 8, label: 'from last week' }}
          />
          <StatCard
            title="New Today"
            value={mockStats.newListingsToday}
            subtitle="listings"
            icon={Clock}
            variant="warning"
          />
          <StatCard
            title="Avg. Profit Margin"
            value={`${mockStats.averageProfitMargin}%`}
            icon={TrendingUp}
            variant="accent"
          />
        </div>

        {/* Quick Stats by Type */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
            <div className="rounded-lg bg-info/10 p-3">
              <Car className="h-5 w-5 text-info" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Vehicles</p>
              <p className="text-xl font-bold">48 deals</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
            <div className="rounded-lg bg-success/10 p-3">
              <Home className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Residential</p>
              <p className="text-xl font-bold">72 deals</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
            <div className="rounded-lg bg-warning/10 p-3">
              <Building2 className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Commercial</p>
              <p className="text-xl font-bold">36 deals</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          counties={counties}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Opportunities Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
            <TabsTrigger value="residential">Residential</TabsTrigger>
            <TabsTrigger value="commercial">Commercial</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {sortedOpportunities.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {sortedOpportunities.map((opportunity) => (
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
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
                <MapPin className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium">No opportunities found</h3>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your filters or check back later
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="vehicles">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sortedOpportunities
                .filter((o) => o.asset_type === 'vehicle')
                .map((opportunity) => (
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
          </TabsContent>

          <TabsContent value="residential">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sortedOpportunities
                .filter((o) => o.asset_type === 'residential')
                .map((opportunity) => (
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
          </TabsContent>

          <TabsContent value="commercial">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sortedOpportunities
                .filter((o) => o.asset_type === 'commercial')
                .map((opportunity) => (
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
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
