UPDATE `site_settings`
SET
  `value` = json_set(
    `value`,
    '$.theme.light.bg', '#f2efe7',
    '$.theme.light.surface', '#f7f4ed',
    '$.theme.light.surfaceStrong', '#e9e4da',
    '$.theme.light.text', '#3f3c36',
    '$.theme.light.textStrong', '#171714',
    '$.theme.light.muted', '#68645b',
    '$.theme.light.faint', '#746f67',
    '$.theme.light.line', '#d4cec2',
    '$.theme.light.lineStrong', '#8b847a',
    '$.theme.light.accent', '#9b3a2e',
    '$.theme.light.accentInk', '#fffaf1',
    '$.theme.dark.bg', '#171714',
    '$.theme.dark.surface', '#1d1c19',
    '$.theme.dark.surfaceStrong', '#282622',
    '$.theme.dark.text', '#d6d0c5',
    '$.theme.dark.textStrong', '#f3eee5',
    '$.theme.dark.muted', '#a49e94',
    '$.theme.dark.faint', '#89847b',
    '$.theme.dark.line', '#34312c',
    '$.theme.dark.lineStrong', '#6d665d',
    '$.theme.dark.accent', '#d56b5a',
    '$.theme.dark.accentInk', '#171714',
    '$.hero.intro.enabled', json('false')
  ),
  `updated_at` = '2026-07-28T00:00:00Z'
WHERE `key` = 'profile';
