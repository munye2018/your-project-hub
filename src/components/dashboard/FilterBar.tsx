import { useState } from 'react';
import { Filter, SortAsc, SortDesc, Search, X, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { FilterOptions, AssetType } from '@/types/opportunity';

interface FilterBarProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  counties: string[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  hasLocation?: boolean;
}

const ASSET_TYPES: { value: AssetType; label: string }[] = [
  { value: 'vehicle', label: 'Vehicles' },
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
];

const formatBudget = (v: number) => {
  if (v >= 1000000) return `${(v / 1000000).toFixed(0)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
  return String(v);
};

export function FilterBar({
  filters,
  onFiltersChange,
  counties,
  searchQuery,
  onSearchChange,
  hasLocation,
}: FilterBarProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleAssetTypeToggle = (type: AssetType) => {
    const newTypes = filters.assetTypes.includes(type)
      ? filters.assetTypes.filter((t) => t !== type)
      : [...filters.assetTypes, type];
    onFiltersChange({ ...filters, assetTypes: newTypes });
  };

  const handleCountyToggle = (county: string) => {
    const newCounties = filters.counties.includes(county)
      ? filters.counties.filter((c) => c !== county)
      : [...filters.counties, county];
    onFiltersChange({ ...filters, counties: newCounties });
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-') as [FilterOptions['sortBy'], FilterOptions['sortOrder']];
    onFiltersChange({ ...filters, sortBy, sortOrder });
  };

  const clearFilters = () => {
    onFiltersChange({
      assetTypes: [],
      counties: [],
      minProfit: 0,
      maxProfit: 100,
      budgetMin: 0,
      budgetMax: 999999999,
      maxDistanceKm: 200,
      status: [],
      sortBy: 'profit',
      sortOrder: 'desc',
    });
    onSearchChange('');
  };

  const activeFilterCount =
    filters.assetTypes.length +
    filters.counties.length +
    (filters.minProfit > 0 ? 1 : 0) +
    (filters.budgetMin > 0 ? 1 : 0) +
    (filters.budgetMax < 999999999 ? 1 : 0) +
    (hasLocation && filters.maxDistanceKm < 200 ? 1 : 0);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, location, category..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
            onClick={() => onSearchChange('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Filter Popover */}
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge className="absolute -right-2 -top-2 h-5 w-5 rounded-full p-0 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filters</h4>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear all
                  </Button>
                )}
              </div>

              {/* Asset Types */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Asset Type</Label>
                <div className="flex flex-wrap gap-2">
                  {ASSET_TYPES.map(({ value, label }) => (
                    <Badge
                      key={value}
                      variant={filters.assetTypes.includes(value) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => handleAssetTypeToggle(value)}
                    >
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Budget Range */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Budget: KES {formatBudget(filters.budgetMin)} – {filters.budgetMax >= 999999999 ? '∞' : `KES ${formatBudget(filters.budgetMax)}`}
                </Label>
                <Slider
                  value={[filters.budgetMin / 1000000, Math.min(filters.budgetMax / 1000000, 100)]}
                  onValueChange={([min, max]) =>
                    onFiltersChange({ ...filters, budgetMin: min * 1000000, budgetMax: max >= 100 ? 999999999 : max * 1000000 })
                  }
                  min={0}
                  max={100}
                  step={1}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>KES 0</span>
                  <span>KES 100M+</span>
                </div>
              </div>

              {/* Profit Range */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Min Profit Margin: {filters.minProfit}%
                </Label>
                <Slider
                  value={[filters.minProfit]}
                  onValueChange={([value]) =>
                    onFiltersChange({ ...filters, minProfit: value })
                  }
                  max={100}
                  step={5}
                />
              </div>

              {/* Distance */}
              {hasLocation && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Within: {filters.maxDistanceKm} km
                  </Label>
                  <Slider
                    value={[filters.maxDistanceKm]}
                    onValueChange={([v]) =>
                      onFiltersChange({ ...filters, maxDistanceKm: v })
                    }
                    min={10}
                    max={200}
                    step={10}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>10 km</span>
                    <span>200 km</span>
                  </div>
                </div>
              )}

              {/* Counties */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Counties</Label>
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {counties.slice(0, 10).map((county) => (
                    <div key={county} className="flex items-center space-x-2">
                      <Checkbox
                        id={county}
                        checked={filters.counties.includes(county)}
                        onCheckedChange={() => handleCountyToggle(county)}
                      />
                      <Label htmlFor={county} className="text-sm cursor-pointer">
                        {county}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Sort */}
        <Select
          value={`${filters.sortBy}-${filters.sortOrder}`}
          onValueChange={handleSortChange}
        >
          <SelectTrigger className="w-[180px]">
            {filters.sortOrder === 'desc' ? (
              <SortDesc className="h-4 w-4 mr-2" />
            ) : (
              <SortAsc className="h-4 w-4 mr-2" />
            )}
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="profit-desc">Highest Profit</SelectItem>
            <SelectItem value="profit-asc">Lowest Profit</SelectItem>
            <SelectItem value="date-desc">Newest First</SelectItem>
            <SelectItem value="date-asc">Oldest First</SelectItem>
            <SelectItem value="price-asc">Lowest Price</SelectItem>
            <SelectItem value="price-desc">Highest Price</SelectItem>
            <SelectItem value="credibility-desc">Best Seller</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
