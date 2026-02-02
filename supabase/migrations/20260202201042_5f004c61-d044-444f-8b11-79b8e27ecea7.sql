-- Add INSERT policy for user_credits to allow the trigger to create records
-- and allow users to initialize their own credits if needed
CREATE POLICY "System can create user credits"
ON public.user_credits
FOR INSERT
WITH CHECK (auth.uid() = user_id);