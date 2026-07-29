UPDATE `site_settings`
SET
  `value` = json_set(`value`, '$.schemaVersion', 1),
  `updated_at` = CURRENT_TIMESTAMP
WHERE `key` = 'profile';
