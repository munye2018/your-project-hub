import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { firecrawlApi } from '@/lib/api/firecrawl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  RefreshCw, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Globe, 
  Car, 
  Home, 
  Building2, 
  Loader2,
  AlertCircle,
  Gavel
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface ScrapingSource {
  id: string;
  name: string;
  platform_type: string;
  base_url: string;
  scrape_frequency: string;
  is_active: boolean;
  last_scraped_at: string | null;
}

interface ScrapingJob {
  id: string;
  source_id: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  items_found: number;
  items_processed: number;
  error_message: string | null;
}

const platformIcons = {
  vehicle: Car,
  residential: Home,
  commercial: Building2,
  general: Globe,
  auction: Gavel,
};

export function ScrapingDashboard() {
  const { toast } = useToast();
  const [sources, setSources] = useState<ScrapingSource[]>([]);
  const [recentJobs, setRecentJobs] = useState<ScrapingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const fetchData = async () => {
    try {
      const { data: sourcesData } = await supabase
        .from('scraping_sources')
        .select('*')
        .order('name');

      const { data: jobsData } = await supabase
        .from('scraping_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      setSources((sourcesData as ScrapingSource[]) || []);
      setRecentJobs((jobsData as ScrapingJob[]) || []);
    } catch (error) {
      console.error('Error fetching scraping data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleScrapeSource = async (sourceId: string) => {
    setScraping(sourceId);
    try {
      const result = await firecrawlApi.scrapeMarketplace(sourceId, 25);
      
      if (result.success) {
        const resultData = result.data as { jobs?: Array<{ urls_found?: number }> } | undefined;
        toast({
          title: 'Scraping Started',
          description: `Found ${resultData?.jobs?.[0]?.urls_found || 0} listings to process.`,
        });
        fetchData();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Scraping error:', error);
      toast({
        title: 'Scraping Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setScraping(null);
    }
  };

  const handleScrapeAll = async () => {
    setScraping('all');
    try {
      const result = await firecrawlApi.scrapeMarketplace(undefined, 25);
      
      if (result.success) {
        const resultData = result.data as { jobs?: Array<{ urls_found?: number }> } | undefined;
        const totalUrls = resultData?.jobs?.reduce((sum: number, job) => sum + (job.urls_found || 0), 0) || 0;
        toast({
          title: 'Scraping All Sources',
          description: `Started scraping. Found ${totalUrls} total listings.`,
        });
        fetchData();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Scraping error:', error);
      toast({
        title: 'Scraping Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setScraping(null);
    }
  };

  const handleProcessListings = async () => {
    setProcessing(true);
    try {
      const result = await firecrawlApi.processListings(10);
      
      if (result.success) {
        const resultData = result.data as { processed?: number } | undefined;
        toast({
          title: 'Processing Complete',
          description: `Processed ${resultData?.processed || 0} listings with AI analysis.`,
        });
        fetchData();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: 'Processing Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'running':
        return <Badge className="bg-blue-500"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Running</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Web Scraping Engine</h2>
          <p className="text-muted-foreground">Collect data from Kenyan marketplaces</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            onClick={handleProcessListings}
            disabled={processing}
          >
            {processing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Process with AI
          </Button>
          <Button 
            onClick={handleScrapeAll}
            disabled={scraping !== null}
          >
            {scraping === 'all' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Globe className="h-4 w-4 mr-2" />
            )}
            Scrape All Sources
          </Button>
        </div>
      </div>

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sources.map(source => {
          const Icon = platformIcons[source.platform_type as keyof typeof platformIcons] || Globe;
          const isScrapingThis = scraping === source.id;

          return (
            <Card key={source.id} className={cn(!source.is_active && 'opacity-60')}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'p-2 rounded-lg',
                      source.platform_type === 'vehicle' && 'bg-blue-100 text-blue-600 dark:bg-blue-950',
                      source.platform_type === 'residential' && 'bg-green-100 text-green-600 dark:bg-green-950',
                      source.platform_type === 'commercial' && 'bg-amber-100 text-amber-600 dark:bg-amber-950',
                      source.platform_type === 'general' && 'bg-purple-100 text-purple-600 dark:bg-purple-950',
                      source.platform_type === 'auction' && 'bg-rose-100 text-rose-600 dark:bg-rose-950'
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-medium">{source.name}</CardTitle>
                      <CardDescription className="text-xs">{source.base_url}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={source.is_active ? 'default' : 'secondary'}>
                    {source.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Frequency: {source.scrape_frequency}</span>
                  <span>
                    {source.last_scraped_at 
                      ? `Last: ${formatDistanceToNow(new Date(source.last_scraped_at), { addSuffix: true })}`
                      : 'Never scraped'
                    }
                  </span>
                </div>
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleScrapeSource(source.id)}
                  disabled={!source.is_active || scraping !== null}
                >
                  {isScrapingThis ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Scrape Now
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Scraping Jobs</CardTitle>
          <CardDescription>History of scraping operations</CardDescription>
        </CardHeader>
        <CardContent>
          {recentJobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>No scraping jobs yet. Start by scraping a source above.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentJobs.map(job => {
                const source = sources.find(s => s.id === job.source_id);
                return (
                  <div 
                    key={job.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusBadge(job.status)}
                      <div>
                        <p className="font-medium text-sm">{source?.name || 'Unknown Source'}</p>
                        <p className="text-xs text-muted-foreground">
                          {job.started_at && formatDistanceToNow(new Date(job.started_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{job.items_found} found</p>
                      <p className="text-xs text-muted-foreground">{job.items_processed} processed</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
