import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { MapPin, Wallet, Tags, ChevronRight, ChevronLeft, Loader2, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { AssetType } from '@/types/opportunity';
import { useToast } from '@/hooks/use-toast';

const BUDGET_RANGES = [
  { label: 'Under KES 1M', min: 0, max: 1000000 },
  { label: 'KES 1M – 5M', min: 1000000, max: 5000000 },
  { label: 'KES 5M – 15M', min: 5000000, max: 15000000 },
  { label: 'KES 15M – 50M', min: 15000000, max: 50000000 },
  { label: 'KES 50M+', min: 50000000, max: 999999999 },
];

const ASSET_CATEGORIES: { value: AssetType; label: string; icon: string; description: string }[] = [
  { value: 'vehicle', label: 'Vehicles', icon: '🚗', description: 'Cars, trucks, motorcycles' },
  { value: 'residential', label: 'Residential', icon: '🏠', description: 'Apartments, houses, land' },
  { value: 'commercial', label: 'Commercial', icon: '🏢', description: 'Offices, retail spaces, warehouses' },
];

export default function Onboarding() {
  const { profile, updateProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [selectedBudget, setSelectedBudget] = useState<number | null>(null);
  const [customMin, setCustomMin] = useState(0);
  const [customMax, setCustomMax] = useState(50000000);
  const [selectedAssets, setSelectedAssets] = useState<AssetType[]>([]);
  const [shareLocation, setShareLocation] = useState(false);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [searchRadius, setSearchRadius] = useState(50);
  const [locating, setLocating] = useState(false);

  const budgetMin = selectedBudget !== null ? BUDGET_RANGES[selectedBudget].min : customMin;
  const budgetMax = selectedBudget !== null ? BUDGET_RANGES[selectedBudget].max : customMax;

  const toggleAsset = (type: AssetType) => {
    setSelectedAssets((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: 'Geolocation not supported', variant: 'destructive' });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
        setShareLocation(true);
        setLocating(false);
        toast({ title: 'Location detected!' });
      },
      () => {
        setLocating(false);
        toast({ title: 'Could not get location', variant: 'destructive' });
      }
    );
  };

  const handleFinish = async () => {
    setSaving(true);
    const { error } = await updateProfile({
      budget_min: budgetMin,
      budget_max: budgetMax,
      preferred_asset_types: selectedAssets,
      user_latitude: shareLocation ? userLat : null,
      user_longitude: shareLocation ? userLng : null,
      search_radius_km: searchRadius,
      onboarding_completed: true,
    } as any);

    if (error) {
      toast({ title: 'Failed to save preferences', variant: 'destructive' });
      setSaving(false);
      return;
    }
    navigate('/');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 w-16 rounded-full transition-colors ${
                s <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Budget */}
        {step === 1 && (
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">What's your budget?</h2>
                <p className="text-muted-foreground text-sm">
                  We'll show you opportunities that fit your price range
                </p>
              </div>

              <div className="grid gap-3">
                {BUDGET_RANGES.map((range, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedBudget(i)}
                    className={`rounded-lg border p-4 text-left transition-all ${
                      selectedBudget === i
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <span className="font-medium">{range.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setStep(2)} disabled={selectedBudget === null}>
                  Continue <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Asset Types */}
        {step === 2 && (
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Tags className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">What interests you?</h2>
                <p className="text-muted-foreground text-sm">
                  Select one or more categories
                </p>
              </div>

              <div className="grid gap-3">
                {ASSET_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => toggleAsset(cat.value)}
                    className={`flex items-center gap-4 rounded-lg border p-4 text-left transition-all ${
                      selectedAssets.includes(cat.value)
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <span className="text-2xl">{cat.icon}</span>
                    <div>
                      <p className="font-medium">{cat.label}</p>
                      <p className="text-sm text-muted-foreground">{cat.description}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ChevronLeft className="mr-1 h-4 w-4" /> Back
                </Button>
                <Button onClick={() => setStep(3)} disabled={selectedAssets.length === 0}>
                  Continue <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Set your search area</h2>
                <p className="text-muted-foreground text-sm">
                  Optional: share your location to find nearby deals
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <Navigation className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Share my location</p>
                      <p className="text-sm text-muted-foreground">
                        {userLat ? 'Location detected' : 'Find deals near you'}
                      </p>
                    </div>
                  </div>
                  {!userLat ? (
                    <Button size="sm" variant="outline" onClick={handleGetLocation} disabled={locating}>
                      {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enable'}
                    </Button>
                  ) : (
                    <Switch checked={shareLocation} onCheckedChange={setShareLocation} />
                  )}
                </div>

                {shareLocation && userLat && (
                  <div className="space-y-3 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Search radius</Label>
                      <Badge variant="outline">{searchRadius} km</Badge>
                    </div>
                    <Slider
                      value={[searchRadius]}
                      onValueChange={([v]) => setSearchRadius(v)}
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
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ChevronLeft className="mr-1 h-4 w-4" /> Back
                </Button>
                <Button onClick={handleFinish} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Get Started
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
