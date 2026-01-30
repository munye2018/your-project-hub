-- Enable realtime on the notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Add performance index for faster unread notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
ON public.notifications (user_id, is_read, created_at DESC);

-- Create function to auto-notify users when high-value opportunities are created
CREATE OR REPLACE FUNCTION public.notify_users_on_high_value_opportunity()
RETURNS TRIGGER AS $$
DECLARE
  user_record RECORD;
  notification_type TEXT;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Only notify for opportunities with profit_percentage > 25%
  IF NEW.profit_percentage IS NULL OR NEW.profit_percentage <= 25 THEN
    RETURN NEW;
  END IF;

  -- Determine notification type based on profit level
  IF NEW.profit_percentage >= 40 THEN
    notification_type := 'high_value';
    notification_title := '🔥 High-Value Deal Found!';
  ELSE
    notification_type := 'new_opportunity';
    notification_title := '💰 New Opportunity Available';
  END IF;

  -- Build the message
  notification_message := format(
    '%s in %s - %s%% potential profit (KES %s)',
    NEW.title,
    NEW.county,
    ROUND(NEW.profit_percentage::numeric, 1),
    TO_CHAR(NEW.profit_potential, 'FM999,999,999')
  );

  -- Notify all users who have matching preferences
  FOR user_record IN 
    SELECT p.user_id 
    FROM public.profiles p
    WHERE p.notifications_enabled = true
    AND (
      -- No region preferences means all regions
      array_length(p.preferred_regions, 1) IS NULL 
      OR NEW.county = ANY(p.preferred_regions)
    )
    AND (
      -- No asset type preferences means all types
      array_length(p.preferred_asset_types, 1) IS NULL 
      OR NEW.asset_type = ANY(p.preferred_asset_types)
    )
  LOOP
    INSERT INTO public.notifications (
      user_id,
      opportunity_id,
      type,
      title,
      message,
      is_read
    ) VALUES (
      user_record.user_id,
      NEW.id,
      notification_type,
      notification_title,
      notification_message,
      false
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to fire when high-value opportunities are inserted
DROP TRIGGER IF EXISTS trigger_notify_high_value_opportunity ON public.opportunities;
CREATE TRIGGER trigger_notify_high_value_opportunity
AFTER INSERT ON public.opportunities
FOR EACH ROW
EXECUTE FUNCTION public.notify_users_on_high_value_opportunity();