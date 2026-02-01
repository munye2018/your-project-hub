import { Car, Home, Building2, MapPin, User, TrendingUp, ExternalLink, Bookmark, X, Lock, Eye } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Opportunity } from '@/types/opportunity';
import { cn } from '@/lib/utils';
import { useCredits } from '@/hooks/useCredits';
import { RevealButton } from '@/components/credits/RevealButton';

interface OpportunityCardProps {
  opportunity: Opportunity;
  isSaved?: boolean;
  onSave?: (id: string) => void;
  onDismiss?: (id: string) => void;
  onContact?: (opportunity: Opportunity) => void;
  onClick?: (opportunity: Opportunity) => void;
}

export function OpportunityCard({
  opportunity,
  isSaved = false,
  onSave,
  onDismiss,
  onContact,
  onClick,
}: OpportunityCardProps) {
  const { isRevealed } = useCredits();
  const revealed = isRevealed(opportunity.id);

  const assetIcons = {
    vehicle: Car,
    residential: Home,
    commercial: Building2,
  };

  const AssetIcon = assetIcons[opportunity.asset_type];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getProfitColor = (percentage: number) => {
    if (percentage >= 30) return 'text-success bg-success/10';
    if (percentage >= 15) return 'text-warning bg-warning/10';
    return 'text-muted-foreground bg-muted';
  };

  const getCredibilityColor = (score: number | null) => {
    if (!score) return 'bg-muted text-muted-foreground';
    if (score >= 8) return 'bg-success/10 text-success';
    if (score >= 5) return 'bg-warning/10 text-warning';
    return 'bg-destructive/10 text-destructive';
  };

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all hover:shadow-lg cursor-pointer',
        'border-l-4',
        opportunity.asset_type === 'vehicle' && 'border-l-info',
        opportunity.asset_type === 'residential' && 'border-l-success',
        opportunity.asset_type === 'commercial' && 'border-l-warning'
      )}
      onClick={() => onClick?.(opportunity)}
    >
      {/* Image */}
      <div className="relative h-48 bg-muted overflow-hidden">
        {opportunity.image_url ? (
          <img
            src={opportunity.image_url}
            alt={opportunity.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <AssetIcon className="h-16 w-16 text-muted-foreground/50" />
          </div>
        )}
        
        {/* Badges overlay */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
            <AssetIcon className="mr-1 h-3 w-3" />
            {opportunity.asset_type}
          </Badge>
          {opportunity.status === 'new' && (
            <Badge className="bg-primary text-primary-foreground">New</Badge>
          )}
        </div>

        {/* Profit badge */}
        <div className="absolute right-3 top-3">
          <Badge className={cn('text-sm font-bold', getProfitColor(opportunity.profit_percentage))}>
            <TrendingUp className="mr-1 h-3 w-3" />
            +{opportunity.profit_percentage.toFixed(1)}%
          </Badge>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Title and location */}
        <div className="mb-3">
          <h3 className="font-semibold text-lg line-clamp-1">{opportunity.title}</h3>
          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
            <MapPin className="h-3 w-3" />
            <span>{opportunity.city || opportunity.county}, {opportunity.county}</span>
          </div>
        </div>

        {/* Pricing */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Listed Price</span>
            <span className="font-medium">{formatCurrency(opportunity.listed_price)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Est. Value</span>
            <span className="font-medium text-success">{formatCurrency(opportunity.estimated_value)}</span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Potential Profit</span>
            <span className="font-bold text-success">{formatCurrency(opportunity.net_profit_potential)}</span>
          </div>
        </div>

        {/* Seller info */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            {revealed ? (
              <span className="text-muted-foreground">{opportunity.seller_name || 'Unknown seller'}</span>
            ) : (
              <span className="text-muted-foreground flex items-center gap-1">
                <Lock className="h-3 w-3" />
                <span className="blur-sm select-none">Hidden Seller</span>
              </span>
            )}
          </div>
          {revealed && opportunity.seller_credibility_score && (
            <Badge className={cn('text-xs', getCredibilityColor(opportunity.seller_credibility_score))}>
              Score: {opportunity.seller_credibility_score}/10
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={(e) => {
            e.stopPropagation();
            onSave?.(opportunity.id);
          }}
        >
          <Bookmark className={cn('h-4 w-4 mr-1', isSaved && 'fill-current')} />
          {isSaved ? 'Saved' : 'Save'}
        </Button>
        {revealed ? (
          <Button
            size="sm"
            className="flex-1"
            onClick={(e) => {
              e.stopPropagation();
              onContact?.(opportunity);
            }}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Contact
          </Button>
        ) : (
          <div onClick={(e) => e.stopPropagation()} className="flex-1">
            <RevealButton
              opportunityId={opportunity.id}
              className="w-full"
            />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss?.(opportunity.id);
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
