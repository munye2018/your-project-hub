import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { KenyaMap } from '@/components/map/KenyaMap';
import { MapFilters } from '@/components/map/MapFilters';
import { MapSidebar } from '@/components/map/MapSidebar';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

export default function MapView() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [selectedAssetTypes, setSelectedAssetTypes] = useState<string[]>(['vehicle', 'residential', 'commercial']);
  const [minProfitPercentage, setMinProfitPercentage] = useState(0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleSaveOpportunity = async (opportunity: Opportunity) => {
    try {
      const { error } = await supabase
        .from('saved_opportunities')
        .insert({
          user_id: user.id,
          opportunity_id: opportunity.id,
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Already Saved',
            description: 'This opportunity is already in your saved list.',
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: 'Saved!',
          description: 'Opportunity added to your saved list.',
        });
      }
    } catch (error) {
      console.error('Error saving opportunity:', error);
      toast({
        title: 'Error',
        description: 'Failed to save opportunity. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-1 relative">
        {/* Map */}
        <div className="absolute inset-0">
          <KenyaMap
            onSelectOpportunity={setSelectedOpportunity}
            selectedAssetTypes={selectedAssetTypes}
            minProfitPercentage={minProfitPercentage}
          />
        </div>

        {/* Filters Panel */}
        <div className="absolute left-4 top-4 z-[1000] w-64">
          <MapFilters
            selectedAssetTypes={selectedAssetTypes}
            onAssetTypesChange={setSelectedAssetTypes}
            minProfitPercentage={minProfitPercentage}
            onMinProfitChange={setMinProfitPercentage}
          />
        </div>

        {/* Selected Opportunity Sidebar */}
        <MapSidebar
          opportunity={selectedOpportunity}
          onClose={() => setSelectedOpportunity(null)}
          onSave={handleSaveOpportunity}
        />

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-[1000] bg-card border rounded-lg p-3">
          <p className="text-xs font-medium mb-2">Legend</p>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span>Vehicles</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Residential</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span>Commercial</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
