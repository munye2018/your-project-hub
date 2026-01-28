import { ExternalLink, Bookmark, X, TrendingUp, MapPin, Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface Opportunity {
  id: string;
  title: string;
  asset_type: string;
  listed_price: number;
  estimated_value: number;
  profit_percentage: number | null;
  county: string;
  city: string | null;
  source_url: string | null;
  status: string | null;
}

interface MapSidebarProps {
  opportunity: Opportunity | null;
  onClose: () => void;
  onSave?: (opportunity: Opportunity) => void;
}

export function MapSidebar({ opportunity, onClose, onSave }: MapSidebarProps) {
  if (!opportunity) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const profitAmount = opportunity.estimated_value - opportunity.listed_price;

  return (
    <Card className="absolute right-4 top-4 w-80 z-[1000] shadow-xl animate-in slide-in-from-right-5">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <Badge 
              variant="outline" 
              className={cn(
                'mb-2',
                opportunity.asset_type === 'vehicle' && 'border-blue-500 text-blue-600',
                opportunity.asset_type === 'residential' && 'border-green-500 text-green-600',
                opportunity.asset_type === 'commercial' && 'border-amber-500 text-amber-600'
              )}
            >
              {opportunity.asset_type}
            </Badge>
            <CardTitle className="text-base leading-tight">{opportunity.title}</CardTitle>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          {opportunity.city ? `${opportunity.city}, ` : ''}{opportunity.county}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Listed Price</p>
            <p className="font-semibold">{formatPrice(opportunity.listed_price)}</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Est. Value</p>
            <p className="font-semibold text-primary">{formatPrice(opportunity.estimated_value)}</p>
          </div>
        </div>

        {profitAmount > 0 && (
          <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700 dark:text-green-400">
                Profit Potential
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-green-600">
                {formatPrice(profitAmount)}
              </span>
              {opportunity.profit_percentage && (
                <span className="text-sm text-green-600">
                  (+{opportunity.profit_percentage.toFixed(0)}%)
                </span>
              )}
            </div>
          </div>
        )}

        <Separator />

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => onSave?.(opportunity)}
          >
            <Bookmark className="h-4 w-4 mr-1.5" />
            Save
          </Button>
          {opportunity.source_url && (
            <Button 
              size="sm" 
              className="flex-1"
              asChild
            >
              <a href={opportunity.source_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-1.5" />
                View Listing
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
