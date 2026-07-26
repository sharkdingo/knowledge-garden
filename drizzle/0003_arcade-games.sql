UPDATE `site_settings`
SET
  `value` = json_set(
    `value`,
    '$.playground',
    json('{"intro":{"eyebrow":"PLAYGROUND / SIDE QUESTS","title":"游乐场","description":"两段真正有风险、成长和重玩价值的支线：穿越失控数据流，或把知识从数据进化成智能。"},"lead":"游戏配置来自云端；最高纪录只保存在当前设备。","runner":{"id":"boundary-runner","eyebrow":"GAME 01 / ARCADE","title":"边界穿梭","description":"操纵穿梭器收集数据包、躲避故障节点。速度会持续上升，连击提高分值，护盾能抵消一次碰撞。","duration":45,"lives":3,"collectGlyphs":["DATA","API","ACK","AI"],"hazardGlyph":"ERR","shieldGlyph":"S"},"fusion":{"id":"knowledge-2048","eyebrow":"GAME 02 / STRATEGY","title":"知识 2048","description":"让相同层级的知识节点合并，从数据一路进化为智能。每一步都要为下一次合并保留空间。","targetValue":2048,"levels":[{"value":2,"glyph":"·","label":"数据"},{"value":4,"glyph":"∴","label":"信息"},{"value":8,"glyph":"◇","label":"概念"},{"value":16,"glyph":"□","label":"模型"},{"value":32,"glyph":"⌁","label":"连接"},{"value":64,"glyph":"◎","label":"知识"},{"value":128,"glyph":"△","label":"系统"},{"value":256,"glyph":"✦","label":"洞察"},{"value":512,"glyph":"⌘","label":"架构"},{"value":1024,"glyph":"∞","label":"智慧"},{"value":2048,"glyph":"∑","label":"智能"}]}}')
  ),
  `updated_at` = '2026-07-23T06:30:00Z'
WHERE `key` = 'profile';
