-- check-subscriptions.sql
-- Automated subscription expiry and user status sync
-- Runs hourly via cron

BEGIN;

-- Step 1: Expire subscriptions where status=ACTIVE but expires_at has passed
WITH expired AS (
  UPDATE subscriptions
  SET status = 'EXPIRED',
      updated_at = NOW()
  WHERE status = 'ACTIVE'
    AND expires_at < NOW()
  RETURNING id
)
SELECT COUNT(*) AS subscriptions_expired FROM expired;

-- Step 2: Deactivate users whose latest subscription is EXPIRED or SUSPENDED
WITH deactivated AS (
  UPDATE users
  SET is_active = false,
      updated_at = NOW()
  WHERE is_active = true
    AND id NOT IN (
      SELECT DISTINCT user_id
      FROM subscriptions
      WHERE status = 'ACTIVE'
        AND expires_at > NOW()
    )
    AND id IN (
      SELECT DISTINCT user_id
      FROM subscriptions
      WHERE status IN ('EXPIRED', 'SUSPENDED')
    )
  RETURNING id
)
SELECT COUNT(*) AS users_deactivated FROM deactivated;

-- Step 3: Activate users who have at least one ACTIVE subscription with valid expires_at
WITH activated AS (
  UPDATE users
  SET is_active = true,
      updated_at = NOW()
  WHERE is_active = false
    AND id IN (
      SELECT DISTINCT user_id
      FROM subscriptions
      WHERE status = 'ACTIVE'
        AND expires_at > NOW()
    )
  RETURNING id
)
SELECT COUNT(*) AS users_activated FROM activated;

COMMIT;

-- Final summary report
SELECT 'SUBSCRIPTIONS' AS entity, status::text, COUNT(*) AS total
FROM subscriptions
GROUP BY status
UNION ALL
SELECT 'USERS', CASE WHEN is_active THEN 'ACTIVE' ELSE 'INACTIVE' END, COUNT(*)
FROM users
GROUP BY is_active
ORDER BY entity, status;
