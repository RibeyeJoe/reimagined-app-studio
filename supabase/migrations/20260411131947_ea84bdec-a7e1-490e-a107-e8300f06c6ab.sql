
-- Table to store uploaded campaign performance data
CREATE TABLE public.campaign_performance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  advertiser_code TEXT NOT NULL,
  advertiser_name TEXT,
  campaign_day DATE NOT NULL,
  line_item_name TEXT,
  flight_start DATE,
  flight_end DATE,
  booked_impressions NUMERIC DEFAULT 0,
  creative_name TEXT,
  creative_duration INTEGER,
  digital_channel TEXT,
  publisher TEXT,
  device_type TEXT,
  genre TEXT,
  dma TEXT,
  zip TEXT,
  daypart TEXT,
  day_of_week TEXT,
  hour_of_day INTEGER,
  impressions NUMERIC DEFAULT 0,
  reach NUMERIC DEFAULT 0,
  frequency NUMERIC DEFAULT 0,
  vcr NUMERIC DEFAULT 0,
  acr NUMERIC DEFAULT 0,
  goal TEXT,
  upload_batch_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast advertiser lookups
CREATE INDEX idx_campaign_perf_advertiser ON public.campaign_performance(advertiser_code);
CREATE INDEX idx_campaign_perf_day ON public.campaign_performance(campaign_day);
CREATE INDEX idx_campaign_perf_batch ON public.campaign_performance(upload_batch_id);

-- Allow public read/write (no auth required for this internal tool)
ALTER TABLE public.campaign_performance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to campaign_performance"
  ON public.campaign_performance FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
