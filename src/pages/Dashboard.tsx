import { useState, useMemo, useEffect } from 'react';
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
  Loader2,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { OpportunityCard } from '@/components/dashboard/OpportunityCard';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Opportunity, FilterOptions, DashboardStats, AssetType } from '@/types/opportunity';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { haversineDistance } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

const CATEGORY_CONFIG: { type: AssetType; label: string; icon: typeof Car }[] = [
  { type: 'vehicle', label: 'Vehicles', icon: Car },
  { type: 'residential', label: 'Residential', icon: Home },
  { type: 'commercial', label: 'Commercial', icon: Building2 },
];

export default function Dashboard() {
  const { profile, user } = useAuth();
  const { toast } = useToast();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [countyCoords, setCountyCoords] = useState<Record<string, { lat: number; lng: number }>>({});
  const [counties, setCounties] = useState<string[]>([]);
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

  // Fetch opportunities from opportunities_public view
  useEffect(() => {
    async function fetchOpportunities() {
      setLoading(true);
      const { data, error } = await supabase
        .from('opportunities_public')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching opportunities:', error);
        toast({ title: 'Failed to load opportunities', variant: 'destructive' });
      } else if (data) {
        const mapped: Opportunity[] = data
          .filter((row) => row.id && row.title && row.asset_type && row.county)
          .map((row) => ({
            id: row.id!,
            asset_type: row.asset_type as AssetType,
            title: row.title!,
            description: row.description ?? null,
            image_url: row.image_url ?? null,
            listed_price: Number(row.listed_price ?? 0),
            estimated_value: Number(row.estimated_value ?? 0),
            profit_potential: Number(row.profit_potential ?? 0),
            profit_percentage: Number(row.profit_percentage ?? 0),
            county: row.county!,
            city: row.city ?? null,
            district: row.district ?? null,
            seller_name: row.seller_name ?? null,
            seller_contact: row.seller_contact ?? null,
            seller_credibility_score: row.seller_credibility_score ? Number(row.seller_credibility_score) : null,
            source_url: row.source_url ?? null,
            source_platform: row.source_platform ?? null,
            improvement_recommendations: Array.isArray(row.improvement_recommendations)
              ? (row.improvement_recommendations as any[])
              : [],
            improvement_cost_estimate: Number(row.improvement_cost_estimate ?? 0),
            net_profit_potential: Number(row.net_profit_potential ?? 0),
            ai_confidence_score: row.ai_confidence_score ? Number(row.ai_confidence_score) : null,
            status: (row.status as Opportunity['status']) ?? 'new',
            scraped_at: row.scraped_at ?? new Date().toISOString(),
            created_at: row.created_at ?? new Date().toISOString(),
            updated_at: row.updated_at ?? new Date().toISOString(),
          }));
        setOpportunities(mapped);
      }
      setLoading(false);
    }
    fetchOpportunities();
  }, []);

  // Fetch counties for coords + filter dropdown
  useEffect(() => {
    async function fetchCounties() {
      const { data, error } = await supabase
        .from('kenya_counties')
        .select('name, latitude, longitude');
      if (!error && data) {
        const coords: Record<string, { lat: number; lng: number }> = {};
        const names: string[] = [];
        data.forEach((c) => {
          names.push(c.name);
          if (c.latitude != null && c.longitude != null) {
            coords[c.name] = { lat: Number(c.latitude), lng: Number(c.longitude) };
          }
        });
        setCountyCoords(coords);
        setCounties(names.sort());
      }
    }
    fetchCounties();
  }, []);

  // Fetch saved opportunities for current user
  useEffect(() => {
    if (!user) return;
    async function fetchSaved() {
      const { data } = await supabase
        .from('saved_opportunities')
        .select('opportunity_id')
        .eq('user_id', user!.id);
      if (data) {
        setSavedIds(new Set(data.map((s) => s.opportunity_id)));
      }
    }
    fetchSaved();
  }, [user]);

  // Compute stats dynamically
  const stats: DashboardStats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const newToday = opportunities.filter((o) => o.created_at.slice(0, 10) === today).length;
    const totalProfit = opportunities.reduce((sum, o) => sum + o.profit_potential, 0);
    const avgMargin =
      opportunities.length > 0
        ? opportunities.reduce((sum, o) => sum + o.profit_percentage, 0) / opportunities.length
        : 0;
    const countyCounts: Record<string, number> = {};
    opportunities.forEach((o) => {
      countyCounts[o.county] = (countyCounts[o.county] || 0) + 1;
    });
    const topCounty = Object.entries(countyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '-';
    const highValue = opportunities.filter((o) => o.profit_percentage >= 30).length;

    return {
      totalOpportunities: opportunities.length,
      totalPotentialProfit: totalProfit,
      newListingsToday: newToday,
      averageProfitMargin: Math.round(avgMargin * 10) / 10,
      topCounty,
      highValueDeals: highValue,
    };
  }, [opportunities]);

  const hasLocation = !!(profile?.user_latitude && profile?.user_longitude);

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `KES ${(amount / 1000000).toFixed(1)}M`;
    return `KES ${(amount / 1000).toFixed(0)}K`;
  };

  const handleSave = async (id: string) => {
    if (!user) return;
    const isSaved = savedIds.has(id);
    if (isSaved) {
      const { error } = await supabase
        .from('saved_opportunities')
        .delete()
        .eq('user_id', user.id)
        .eq('opportunity_id', id);
      if (!error) {
        setSavedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
        toast({ title: 'Removed from saved' });
      }
    } else {
      const { error } = await supabase
        .from('saved_opportunities')
        .insert({ user_id: user.id, opportunity_id: id });
      if (!error) {
        setSavedIds((prev) => new Set(prev).add(id));
        toast({ title: 'Saved to your list' });
      }
    }
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

      if (hasLocation && filters.maxDistanceKm < 200) {
        const coords = countyCoords[opp.county];
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
  }, [opportunities, filters, searchQuery, hasLocation, profile, countyCoords]);

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
        const coords = countyCoords[o.county];
        if (!coords) return null;
        const dist = haversineDistance(profile!.user_latitude!, profile!.user_longitude!, coords.lat, coords.lng);
        return { ...o, distance: dist };
      })
      .filter(Boolean)
      .sort((a, b) => a!.distance - b!.distance)
      .slice(0, 4) as (Opportunity & { distance: number })[];
  }, [sortedOpportunities, hasLocation, profile, countyCoords]);

  const noBudgetMatch = !loading && sortedOpportunities.length === 0 && opportunities.length > 0;

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
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))
          ) : (
            <>
              <StatCard title="Total Opportunities" value={stats.totalOpportunities} icon={Target} variant="primary" />
              <StatCard title="Potential Profit" value={formatCurrency(stats.totalPotentialProfit)} icon={DollarSign} variant="success" />
              <StatCard title="New Today" value={stats.newListingsToday} subtitle="listings" icon={Clock} variant="warning" />
              <StatCard title="Avg. Profit Margin" value={`${stats.averageProfitMargin}%`} icon={TrendingUp} variant="accent" />
            </>
          )}
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

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading opportunities...</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && opportunities.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 gap-2">
            <MapPin className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-lg font-medium">No opportunities yet</p>
            <p className="text-sm text-muted-foreground">Trigger a scrape from the admin panel to populate data</p>
          </div>
        )}

        {/* Budget mismatch banner */}
        {noBudgetMatch && (
          <div className="rounded-lg border border-dashed border-warning bg-warning/5 p-4 text-center">
            <p className="text-sm font-medium">No opportunities in your budget range.</p>
            <p className="text-xs text-muted-foreground">Try adjusting your budget filter above</p>
          </div>
        )}

        {!loading && opportunities.length > 0 && (
          <>
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
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
