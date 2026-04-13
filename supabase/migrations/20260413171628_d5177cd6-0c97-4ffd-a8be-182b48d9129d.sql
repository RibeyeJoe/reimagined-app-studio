
-- Materialized view: filter options
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_report_filters AS
SELECT
  'advertiser' AS filter_type,
  advertiser_code AS code,
  COALESCE(MAX(advertiser_name), advertiser_code) AS name
FROM campaign_performance
WHERE advertiser_code IS NOT NULL
GROUP BY advertiser_code
UNION ALL
SELECT
  'channel',
  digital_channel,
  digital_channel
FROM campaign_performance
WHERE digital_channel IS NOT NULL
GROUP BY digital_channel
UNION ALL
SELECT
  'goal',
  goal,
  goal
FROM campaign_performance
WHERE goal IS NOT NULL
GROUP BY goal;

CREATE UNIQUE INDEX idx_mv_filters ON public.mv_report_filters (filter_type, code);

-- Materialized view: by channel
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_report_by_channel AS
SELECT
  advertiser_code,
  COALESCE(digital_channel, 'Unknown') AS channel,
  goal,
  MIN(campaign_day) AS min_day,
  MAX(campaign_day) AS max_day,
  COALESCE(SUM(impressions), 0) AS impressions,
  COALESCE(SUM(reach), 0) AS reach,
  COUNT(*)::bigint AS row_count
FROM campaign_performance
GROUP BY advertiser_code, COALESCE(digital_channel, 'Unknown'), goal;

CREATE INDEX idx_mv_channel_adv ON public.mv_report_by_channel (advertiser_code);
CREATE INDEX idx_mv_channel_goal ON public.mv_report_by_channel (goal);

-- Materialized view: by advertiser
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_report_by_advertiser AS
SELECT
  cp.advertiser_code,
  COALESCE(MAX(cp.advertiser_name), cp.advertiser_code) AS advertiser_name,
  cp.goal,
  MIN(cp.campaign_day) AS min_day,
  MAX(cp.campaign_day) AS max_day,
  COALESCE(SUM(cp.impressions), 0) AS impressions,
  COALESCE(SUM(cp.reach), 0) AS reach,
  COUNT(*)::bigint AS row_count,
  COUNT(DISTINCT cp.digital_channel)::bigint AS channel_count,
  COUNT(DISTINCT cp.dma)::bigint AS dma_count
FROM campaign_performance cp
GROUP BY cp.advertiser_code, cp.goal;

CREATE INDEX idx_mv_adv_code ON public.mv_report_by_advertiser (advertiser_code);

-- Materialized view: by DMA
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_report_by_dma AS
SELECT
  advertiser_code,
  COALESCE(dma, 'Unknown') AS dma,
  goal,
  MIN(campaign_day) AS min_day,
  MAX(campaign_day) AS max_day,
  COALESCE(SUM(impressions), 0) AS impressions,
  COALESCE(SUM(reach), 0) AS reach,
  COUNT(*)::bigint AS row_count
FROM campaign_performance
GROUP BY advertiser_code, COALESCE(dma, 'Unknown'), goal;

CREATE INDEX idx_mv_dma_adv ON public.mv_report_by_dma (advertiser_code);

-- Materialized view: summary stats
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_report_summary AS
SELECT
  advertiser_code,
  goal,
  digital_channel,
  MIN(campaign_day) AS min_day,
  MAX(campaign_day) AS max_day,
  COUNT(*)::bigint AS total_rows,
  COALESCE(SUM(impressions), 0) AS total_impressions,
  COALESCE(SUM(reach), 0) AS total_reach,
  COALESCE(AVG(frequency), 0) AS avg_frequency,
  COALESCE(AVG(vcr) FILTER (WHERE vcr IS NOT NULL AND vcr > 0), 0) AS avg_vcr,
  COUNT(DISTINCT dma)::bigint AS unique_dmas
FROM campaign_performance
GROUP BY advertiser_code, goal, digital_channel;

CREATE INDEX idx_mv_summary_adv ON public.mv_report_summary (advertiser_code);

-- Refresh function
CREATE OR REPLACE FUNCTION public.refresh_report_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_report_filters;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_report_by_channel;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_report_by_advertiser;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_report_by_dma;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_report_summary;
END;
$$;

-- Replace report functions to use materialized views

CREATE OR REPLACE FUNCTION public.report_advertisers_list()
RETURNS TABLE(code text, name text)
LANGUAGE sql STABLE SET search_path TO 'public'
AS $$
  SELECT code, name FROM mv_report_filters WHERE filter_type = 'advertiser' ORDER BY name;
$$;

CREATE OR REPLACE FUNCTION public.report_channels_list()
RETURNS TABLE(channel text)
LANGUAGE sql STABLE SET search_path TO 'public'
AS $$
  SELECT code AS channel FROM mv_report_filters WHERE filter_type = 'channel' ORDER BY code;
$$;

CREATE OR REPLACE FUNCTION public.report_goals_list()
RETURNS TABLE(goal text)
LANGUAGE sql STABLE SET search_path TO 'public'
AS $$
  SELECT code AS goal FROM mv_report_filters WHERE filter_type = 'goal' ORDER BY code;
$$;

CREATE OR REPLACE FUNCTION public.report_summary(
  p_advertiser text DEFAULT NULL,
  p_channel text DEFAULT NULL,
  p_goal text DEFAULT NULL,
  p_date_from date DEFAULT NULL,
  p_date_to date DEFAULT NULL
)
RETURNS TABLE(total_rows bigint, total_impressions numeric, total_reach numeric, avg_frequency numeric, avg_vcr numeric, unique_advertisers bigint, unique_channels bigint, unique_dmas bigint)
LANGUAGE sql STABLE SET search_path TO 'public'
AS $$
  SELECT
    SUM(s.total_rows)::bigint,
    SUM(s.total_impressions),
    SUM(s.total_reach),
    CASE WHEN SUM(s.total_rows) > 0 THEN AVG(s.avg_frequency) ELSE 0 END,
    CASE WHEN SUM(s.total_rows) > 0 THEN AVG(s.avg_vcr) FILTER (WHERE s.avg_vcr > 0) ELSE 0 END,
    COUNT(DISTINCT s.advertiser_code)::bigint,
    COUNT(DISTINCT s.digital_channel)::bigint,
    SUM(s.unique_dmas)::bigint
  FROM mv_report_summary s
  WHERE (p_advertiser IS NULL OR s.advertiser_code = p_advertiser)
    AND (p_channel IS NULL OR s.digital_channel = p_channel)
    AND (p_goal IS NULL OR s.goal = p_goal)
    AND (p_date_from IS NULL OR s.max_day >= p_date_from)
    AND (p_date_to IS NULL OR s.min_day <= p_date_to);
$$;

CREATE OR REPLACE FUNCTION public.report_by_channel(
  p_advertiser text DEFAULT NULL,
  p_channel text DEFAULT NULL,
  p_goal text DEFAULT NULL,
  p_date_from date DEFAULT NULL,
  p_date_to date DEFAULT NULL
)
RETURNS TABLE(channel text, impressions numeric, reach numeric, row_count bigint)
LANGUAGE sql STABLE SET search_path TO 'public'
AS $$
  SELECT
    c.channel,
    SUM(c.impressions),
    SUM(c.reach),
    SUM(c.row_count)::bigint
  FROM mv_report_by_channel c
  WHERE (p_advertiser IS NULL OR c.advertiser_code = p_advertiser)
    AND (p_channel IS NULL OR c.channel = p_channel)
    AND (p_goal IS NULL OR c.goal = p_goal)
    AND (p_date_from IS NULL OR c.max_day >= p_date_from)
    AND (p_date_to IS NULL OR c.min_day <= p_date_to)
  GROUP BY c.channel
  ORDER BY SUM(c.impressions) DESC;
$$;

CREATE OR REPLACE FUNCTION public.report_by_advertiser(
  p_advertiser text DEFAULT NULL,
  p_channel text DEFAULT NULL,
  p_goal text DEFAULT NULL,
  p_date_from date DEFAULT NULL,
  p_date_to date DEFAULT NULL
)
RETURNS TABLE(advertiser_code text, advertiser_name text, impressions numeric, reach numeric, row_count bigint, channel_count bigint, dma_count bigint)
LANGUAGE sql STABLE SET search_path TO 'public'
AS $$
  SELECT
    a.advertiser_code,
    MAX(a.advertiser_name),
    SUM(a.impressions),
    SUM(a.reach),
    SUM(a.row_count)::bigint,
    MAX(a.channel_count)::bigint,
    MAX(a.dma_count)::bigint
  FROM mv_report_by_advertiser a
  WHERE (p_advertiser IS NULL OR a.advertiser_code = p_advertiser)
    AND (p_goal IS NULL OR a.goal = p_goal)
    AND (p_date_from IS NULL OR a.max_day >= p_date_from)
    AND (p_date_to IS NULL OR a.min_day <= p_date_to)
  GROUP BY a.advertiser_code
  ORDER BY SUM(a.impressions) DESC;
$$;

CREATE OR REPLACE FUNCTION public.report_by_dma(
  p_advertiser text DEFAULT NULL,
  p_channel text DEFAULT NULL,
  p_goal text DEFAULT NULL,
  p_date_from date DEFAULT NULL,
  p_date_to date DEFAULT NULL
)
RETURNS TABLE(dma text, impressions numeric, reach numeric, row_count bigint)
LANGUAGE sql STABLE SET search_path TO 'public'
AS $$
  SELECT
    d.dma,
    SUM(d.impressions),
    SUM(d.reach),
    SUM(d.row_count)::bigint
  FROM mv_report_by_dma d
  WHERE (p_advertiser IS NULL OR d.advertiser_code = p_advertiser)
    AND (p_channel IS NULL OR d.dma = p_channel)
    AND (p_goal IS NULL OR d.goal = p_goal)
    AND (p_date_from IS NULL OR d.max_day >= p_date_from)
    AND (p_date_to IS NULL OR d.min_day <= p_date_to)
  GROUP BY d.dma
  ORDER BY SUM(d.impressions) DESC
  LIMIT 50;
$$;
