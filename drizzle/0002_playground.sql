UPDATE `site_settings`
SET
  `value` = json_set(
    `value`,
    '$.hero.titleLines',
    json('["把复杂的问题，","写成清晰的路径。"]'),
    '$.playground',
    json('{"intro":{"eyebrow":"PLAYGROUND / SIDE QUESTS","title":"游乐场","description":"把注意力从长文章里借走几分钟，玩两个藏在知识花园里的交互实验。"},"lead":"成绩只保存在当前设备；刷新不会影响文章与项目数据。","signal":{"id":"signal-hunt","eyebrow":"GAME 01 / REACTION","title":"信号捕手","description":"在有限时间里追踪游走的信号节点，训练反应与注意力。","duration":20,"symbols":["◇","◎","✦","⌁","△"]},"memory":{"id":"memory-links","eyebrow":"GAME 02 / MEMORY","title":"节点配对","description":"翻开卡片，把散落的知识节点重新连接起来。","pairs":[{"id":"context","glyph":"⌘","label":"上下文"},{"id":"boundary","glyph":"□","label":"边界"},{"id":"trace","glyph":"⌁","label":"轨迹"},{"id":"edge","glyph":"△","label":"边缘"},{"id":"signal","glyph":"◎","label":"信号"},{"id":"garden","glyph":"✦","label":"花园"}]}}')
  ),
  `updated_at` = '2026-07-23T04:20:00Z'
WHERE `key` = 'profile';--> statement-breakpoint

INSERT INTO `navigation_items` (`id`, `location`, `href`, `label`, `sort_order`) VALUES
  ('play', 'header', '/play', '游乐场', 60),
  ('footer-play', 'footer', '/play', '游乐场', 35);
