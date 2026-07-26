UPDATE `site_settings`
SET
  `value` = json_set(
    `value`,
    '$.theme.dark.faint', '#8b9195',
    '$.theme.dark.lineStrong', '#687074',
    '$.theme.light.faint', '#6d7276',
    '$.theme.light.lineStrong', '#8b9094',
    '$.hero.image', '/images/hero-knowledge-garden.webp',
    '$.about.image.src', '/images/identity-landscape.webp',
    '$.playground.runner.collectGlyphs', json('["D","API","AI","ACK"]')
  ),
  `updated_at` = '2026-07-23T05:10:00Z'
WHERE `key` = 'profile';
