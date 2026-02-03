import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, MapPin, TrendingUp, Bookmark } from 'lucide-react';
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
  status: string | null;
}

interface County {
  id: string;
  name: string;
  code: string;
  latitude: number | null;
  longitude: number | null;
}

interface CountyOpportunities {
  county: County;
  opportunities: Opportunity[];
}

// Custom marker icons by asset type
const createMarkerIcon = (assetType: string, count: number) => {
  const colors = {
    vehicle: '#3B82F6', // Blue
    residential: '#22C55E', // Green
    commercial: '#F59E0B', // Amber
    general: '#8B5CF6', // Purple
  };
  
  const color = colors[assetType as keyof typeof colors] || colors.general;
  const size = Math.min(40, 24 + count * 2);

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: ${size > 30 ? '14px' : '12px'};
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        ${count > 1 ? count : ''}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 6);
  }, [center, map]);
  return null;
}

interface KenyaMapProps {
  onSelectOpportunity?: (opportunity: Opportunity) => void;
  selectedAssetTypes?: string[];
  minProfitPercentage?: number;
}

export function KenyaMap({ 
  onSelectOpportunity, 
  selectedAssetTypes = ['vehicle', 'residential', 'commercial'],
  minProfitPercentage = 0 
}: KenyaMapProps) {
  const [counties, setCounties] = useState<County[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch counties with coordinates
        const { data: countiesData } = await supabase
          .from('kenya_counties')
          .select('*')
          .not('latitude', 'is', null);

        // Fetch opportunities from the secure view that masks seller info
        // Use explicit table name with type assertion since it's a view
        const { data: opportunitiesData, error: oppError } = await supabase
          .from('opportunities_public')
          .select('id, title, asset_type, listed_price, estimated_value, profit_percentage, county, city, status')
          .in('asset_type', selectedAssetTypes)
          .gte('profit_percentage', minProfitPercentage);

        if (oppError) {
          console.error('Error fetching opportunities:', oppError);
        }

        setCounties((countiesData as County[]) || []);
        setOpportunities((opportunitiesData as unknown as Opportunity[]) || []);
      } catch (error) {
        console.error('Error fetching map data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedAssetTypes, minProfitPercentage]);

  const countyOpportunities = useMemo(() => {
    const grouped: CountyOpportunities[] = [];

    counties.forEach(county => {
      const countyOpps = opportunities.filter(
        opp => opp.county.toLowerCase() === county.name.toLowerCase()
      );
      
      if (countyOpps.length > 0 && county.latitude && county.longitude) {
        grouped.push({ county, opportunities: countyOpps });
      }
    });

    return grouped;
  }, [counties, opportunities]);

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `KES ${(price / 1000000).toFixed(1)}M`;
    }
    return `KES ${(price / 1000).toFixed(0)}K`;
  };

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/50">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <MapContainer
      center={[-1.286389, 36.817223]} // Nairobi center
      zoom={6}
      style={{ height: '100%', width: '100%' }}
      className="rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController center={[-1.286389, 36.817223]} />

      {countyOpportunities.map(({ county, opportunities: opps }) => {
        const primaryType = opps[0]?.asset_type || 'general';
        
        return (
          <Marker
            key={county.id}
            position={[county.latitude!, county.longitude!]}
            icon={createMarkerIcon(primaryType, opps.length)}
          >
            <Popup className="map-popup" minWidth={280} maxWidth={350}>
              <Card className="border-0 shadow-none">
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    {county.name} County
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {opps.length} {opps.length === 1 ? 'opportunity' : 'opportunities'}
                  </p>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-2 max-h-60 overflow-y-auto">
                  {opps.slice(0, 5).map(opp => (
                    <div 
                      key={opp.id} 
                      className="p-2 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => onSelectOpportunity?.(opp)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{opp.title}</p>
                          <p className="text-xs text-muted-foreground">{formatPrice(opp.listed_price)}</p>
                        </div>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            'text-xs shrink-0',
                            opp.asset_type === 'vehicle' && 'border-blue-500 text-blue-600',
                            opp.asset_type === 'residential' && 'border-green-500 text-green-600',
                            opp.asset_type === 'commercial' && 'border-amber-500 text-amber-600'
                          )}
                        >
                          {opp.asset_type}
                        </Badge>
                      </div>
                      {opp.profit_percentage && opp.profit_percentage > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          <span className="text-xs text-green-600 font-medium">
                            +{opp.profit_percentage.toFixed(0)}% potential profit
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                  {opps.length > 5 && (
                    <p className="text-xs text-center text-muted-foreground py-1">
                      +{opps.length - 5} more opportunities
                    </p>
                  )}
                </CardContent>
              </Card>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
