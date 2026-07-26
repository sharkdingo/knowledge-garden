UPDATE `site_settings`
SET
  `value` = json_set(
    `value`,
    '$.algorithmHub.overviewTitle', '解法一览',
    '$.algorithmHub.approachLabel', '解法',
    '$.algorithmHub.copyErrorLabel', '复制失败，请手动选择'
  ),
  `updated_at` = '2026-07-26T08:45:00Z'
WHERE `key` = 'profile';
