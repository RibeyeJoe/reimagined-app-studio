
CREATE OR REPLACE FUNCTION public.report_advertisers_list()
RETURNS TABLE(code text, name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT code, name FROM mv_report_filters WHERE filter_type = 'advertiser' ORDER BY name;
$$;

CREATE OR REPLACE FUNCTION public.report_channels_list()
RETURNS TABLE(channel text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT code AS channel FROM mv_report_filters WHERE filter_type = 'channel' ORDER BY code;
$$;

CREATE OR REPLACE FUNCTION public.report_goals_list()
RETURNS TABLE(goal text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
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
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
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
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
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
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
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
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT
    d.dma,
    SUM(d.impressions),
    SUM(d.reach),
    SUM(d.row_count)::bigint
  FROM mv_report_by_dma d
  WHERE (p_advertiser IS NULL OR d.advertiser_code = p_advertiser)
    AND (p_goal IS NULL OR d.goal = p_goal)
    AND (p_date_from IS NULL OR d.max_day >= p_date_from)
    AND (p_date_to IS NULL OR d.min_day <= p_date_to)
  GROUP BY d.dma
  ORDER BY SUM(d.impressions) DESC
  LIMIT 50;
$$;
