CREATE INDEX IF NOT EXISTS idx_cp_advertiser_code ON public.campaign_performance (advertiser_code);
CREATE INDEX IF NOT EXISTS idx_cp_digital_channel ON public.campaign_performance (digital_channel);
CREATE INDEX IF NOT EXISTS idx_cp_campaign_day ON public.campaign_performance (campaign_day);
CREATE INDEX IF NOT EXISTS idx_cp_goal ON public.campaign_performance (goal);
CREATE INDEX IF NOT EXISTS idx_cp_report_composite ON public.campaign_performance (advertiser_code, digital_channel, campaign_day);