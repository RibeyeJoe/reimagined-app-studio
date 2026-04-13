
-- Function: list unique advertisers for filter dropdown
CREATE OR REPLACE FUNCTION public.report_advertisers_list()
RETURNS TABLE(code text, name text)
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT DISTINCT advertiser_code AS code,
         COALESCE(advertiser_name, advertiser_code) AS name
  FROM campaign_performance
  WHERE advertiser_code IS NOT NULL
  ORDER BY name;
$$;

-- Function: summary totals with optional filters
CREATE OR REPLACE FUNCTION public.report_summary(
  p_advertiser text DEFAULT NULL,
  p_channel text DEFAULT NULL,
  p_goal text DEFAULT NULL,
  p_date_from date DEFAULT NULL,
  p_date_to date DEFAULT NULL
)
RETURNS TABLE(
  total_rows bigint,
  total_impressions numeric,
  total_reach numeric,
  avg_frequency numeric,
  avg_vcr numeric,
  unique_advertisers bigint,
  unique_channels bigint,
  unique_dmas bigint
)
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT
    COUNT(*)::bigint,
    COALESCE(SUM(impressions), 0),
    COALESCE(SUM(reach), 0),
    CASE WHEN COUNT(*) > 0 THEN COALESCE(AVG(frequency), 0) ELSE 0 END,
    CASE WHEN COUNT(*) FILTER (WHERE vcr IS NOT NULL AND vcr > 0) > 0
         THEN AVG(vcr) FILTER (WHERE vcr IS NOT NULL AND vcr > 0) ELSE 0 END,
    COUNT(DISTINCT advertiser_code)::bigint,
    COUNT(DISTINCT digital_channel)::bigint,
    COUNT(DISTINCT dma)::bigint
  FROM campaign_performance
  WHERE (p_advertiser IS NULL OR advertiser_code = p_advertiser)
    AND (p_channel IS NULL OR digital_channel = p_channel)
    AND (p_goal IS NULL OR goal = p_goal)
    AND (p_date_from IS NULL OR campaign_day >= p_date_from)
    AND (p_date_to IS NULL OR campaign_day <= p_date_to);
$$;

-- Function: breakdown by channel
CREATE OR REPLACE FUNCTION public.report_by_channel(
  p_advertiser text DEFAULT NULL,
  p_channel text DEFAULT NULL,
  p_goal text DEFAULT NULL,
  p_date_from date DEFAULT NULL,
  p_date_to date DEFAULT NULL
)
RETURNS TABLE(channel text, impressions numeric, reach numeric, row_count bigint)
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT
    COALESCE(digital_channel, 'Unknown') AS channel,
    COALESCE(SUM(cp.impressions), 0),
    COALESCE(SUM(cp.reach), 0),
    COUNT(*)::bigint
  FROM campaign_performance cp
  WHERE (p_advertiser IS NULL OR cp.advertiser_code = p_advertiser)
    AND (p_channel IS NULL OR cp.digital_channel = p_channel)
    AND (p_goal IS NULL OR cp.goal = p_goal)
    AND (p_date_from IS NULL OR cp.campaign_day >= p_date_from)
    AND (p_date_to IS NULL OR cp.campaign_day <= p_date_to)
  GROUP BY COALESCE(digital_channel, 'Unknown')
  ORDER BY COALESCE(SUM(cp.impressions), 0) DESC;
$$;

-- Function: breakdown by advertiser
CREATE OR REPLACE FUNCTION public.report_by_advertiser(
  p_advertiser text DEFAULT NULL,
  p_channel text DEFAULT NULL,
  p_goal text DEFAULT NULL,
  p_date_from date DEFAULT NULL,
  p_date_to date DEFAULT NULL
)
RETURNS TABLE(advertiser_code text, advertiser_name text, impressions numeric, reach numeric, row_count bigint, channel_count bigint, dma_count bigint)
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT
    cp.advertiser_code,
    COALESCE(MAX(cp.advertiser_name), cp.advertiser_code),
    COALESCE(SUM(cp.impressions), 0),
    COALESCE(SUM(cp.reach), 0),
    COUNT(*)::bigint,
    COUNT(DISTINCT cp.digital_channel)::bigint,
    COUNT(DISTINCT cp.dma)::bigint
  FROM campaign_performance cp
  WHERE (p_advertiser IS NULL OR cp.advertiser_code = p_advertiser)
    AND (p_channel IS NULL OR cp.digital_channel = p_channel)
    AND (p_goal IS NULL OR cp.goal = p_goal)
    AND (p_date_from IS NULL OR cp.campaign_day >= p_date_from)
    AND (p_date_to IS NULL OR cp.campaign_day <= p_date_to)
  GROUP BY cp.advertiser_code
  ORDER BY COALESCE(SUM(cp.impressions), 0) DESC;
$$;

-- Function: breakdown by DMA (top 50)
CREATE OR REPLACE FUNCTION public.report_by_dma(
  p_advertiser text DEFAULT NULL,
  p_channel text DEFAULT NULL,
  p_goal text DEFAULT NULL,
  p_date_from date DEFAULT NULL,
  p_date_to date DEFAULT NULL
)
RETURNS TABLE(dma text, impressions numeric, reach numeric, row_count bigint)
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT
    COALESCE(cp.dma, 'Unknown') AS dma,
    COALESCE(SUM(cp.impressions), 0),
    COALESCE(SUM(cp.reach), 0),
    COUNT(*)::bigint
  FROM campaign_performance cp
  WHERE (p_advertiser IS NULL OR cp.advertiser_code = p_advertiser)
    AND (p_channel IS NULL OR cp.digital_channel = p_channel)
    AND (p_goal IS NULL OR cp.goal = p_goal)
    AND (p_date_from IS NULL OR cp.campaign_day >= p_date_from)
    AND (p_date_to IS NULL OR cp.campaign_day <= p_date_to)
  GROUP BY COALESCE(cp.dma, 'Unknown')
  ORDER BY COALESCE(SUM(cp.impressions), 0) DESC
  LIMIT 50;
$$;

-- Function: unique channels for filter
CREATE OR REPLACE FUNCTION public.report_channels_list()
RETURNS TABLE(channel text)
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT DISTINCT digital_channel AS channel
  FROM campaign_performance
  WHERE digital_channel IS NOT NULL
  ORDER BY channel;
$$;

-- Function: unique goals for filter
CREATE OR REPLACE FUNCTION public.report_goals_list()
RETURNS TABLE(goal text)
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT DISTINCT goal
  FROM campaign_performance
  WHERE goal IS NOT NULL
  ORDER BY goal;
$$;
