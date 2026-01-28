import { Car, Home, Building2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface MapFiltersProps {
  selectedAssetTypes: string[];
  onAssetTypesChange: (types: string[]) => void;
  minProfitPercentage: number;
  onMinProfitChange: (value: number) => void;
}

const assetTypeButtons = [
  { value: 'vehicle', label: 'Vehicles', icon: Car, color: 'bg-blue-500' },
  { value: 'residential', label: 'Residential', icon: Home, color: 'bg-green-500' },
  { value: 'commercial', label: 'Commercial', icon: Building2, color: 'bg-amber-500' },
];

export function MapFilters({
  selectedAssetTypes,
  onAssetTypesChange,
  minProfitPercentage,
  onMinProfitChange,
}: MapFiltersProps) {
  const toggleAssetType = (type: string) => {
    if (selectedAssetTypes.includes(type)) {
      if (selectedAssetTypes.length > 1) {
        onAssetTypesChange(selectedAssetTypes.filter(t => t !== type));
      }
    } else {
      onAssetTypesChange([...selectedAssetTypes, type]);
    }
  };

  return (
    <div className="bg-card border rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Filter className="h-4 w-4" />
        Map Filters
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Asset Types</Label>
        <div className="flex flex-wrap gap-2">
          {assetTypeButtons.map(({ value, label, icon: Icon, color }) => (
            <Button
              key={value}
              variant={selectedAssetTypes.includes(value) ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'gap-1.5',
                selectedAssetTypes.includes(value) && color
              )}
              onClick={() => toggleAssetType(value)}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">Min. Profit Margin</Label>
          <span className="text-sm font-medium">{minProfitPercentage}%+</span>
        </div>
        <Slider
          value={[minProfitPercentage]}
          onValueChange={([value]) => onMinProfitChange(value)}
          min={0}
          max={100}
          step={5}
          className="w-full"
        />
      </div>
    </div>
  );
}
