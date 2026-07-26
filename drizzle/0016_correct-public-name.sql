UPDATE `site_settings`
SET
  `value` = json_set(
    `value`,
    '$.identity.name', 'sharkdingo 的知识花园',
    '$.identity.shortName', 'sharkdingo',
    '$.identity.latinName', 'sharkdingo',
    '$.identity.author', 'sharkdingo',
    '$.footer.statement', '© 2026 sharkdingo · 在持续学习中构建。',
    '$.hero.eyebrow', 'SHARKDINGO / KNOWLEDGE GARDEN',
    '$.hero.lead', '我是 sharkdingo，一名关注软件架构、AI 工作流与 IoT 的开发者。这里保存问题如何被理解、系统如何被构建。',
    '$.hero.intro.lines', json('["正在连接知识节点","正在展开个人坐标","欢迎进入 sharkdingo 的数字花园"]'),
    '$.about.name', 'sharkdingo'
  ),
  `updated_at` = CURRENT_TIMESTAMP
WHERE `key` = 'profile';
