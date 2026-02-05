import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';

export default function SubscriptionSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { checkSubscription, loading, subscribed, tier } = useSubscription(user?.id);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Refresh subscription status after successful checkout
    if (sessionId) {
      const timer = setTimeout(() => {
        checkSubscription();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [sessionId, checkSubscription]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {loading ? (
            <>
              <Loader2 className="h-16 w-16 text-primary mx-auto animate-spin mb-4" />
              <CardTitle className="text-2xl">Processing...</CardTitle>
              <CardDescription>
                Please wait while we confirm your subscription
              </CardDescription>
            </>
          ) : subscribed ? (
            <>
              <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
              <CardTitle className="text-2xl">Subscription Successful!</CardTitle>
              <CardDescription>
                Welcome to the {tier.charAt(0).toUpperCase() + tier.slice(1)} plan
              </CardDescription>
            </>
          ) : (
            <>
              <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
              <CardTitle className="text-2xl">Thank You!</CardTitle>
              <CardDescription>
                Your payment is being processed. It may take a moment to reflect.
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {subscribed && (
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Your credits have been updated. Start exploring opportunities!
              </p>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Button onClick={() => navigate('/')} className="w-full">
              Go to Dashboard
            </Button>
            <Button variant="outline" onClick={() => checkSubscription()} className="w-full">
              Refresh Status
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
