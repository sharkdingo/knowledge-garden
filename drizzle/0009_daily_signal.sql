UPDATE `site_settings`
SET
  `value` = json_set(
    `value`,
    '$.daily',
    json('{"timeZone":"Asia/Shanghai","eyebrow":"DAILY SIGNAL / 今日信号","titleTemplate":"今天，沿着「{tag}」走一条不同的路","description":"这里会在每天零点重新组合一篇文章、一个项目与一个主题。不是随机推荐，而是一条只属于今天的浏览路径。","articleLabel":"今日阅读","projectLabel":"今日项目","visitTemplate":"这是这台设备第 {count} 次经过知识花园","prompt":"你今天想以什么状态进入？","resetLabel":"换一种状态","greetings":{"morning":"早上好，花园刚刚醒来。","afternoon":"下午好，适合沿着一条线索深入。","evening":"晚上好，慢一点浏览也很好。"},"modes":[{"id":"curious","label":"带着好奇","reply":"那就先不追求结论，从今天的主题岔路开始。","target":"article","actionLabel":"顺着今日文章出发"},{"id":"focused","label":"想要专注","reply":"我替你收起多余入口，只留下一个可以深入的项目。","target":"project","actionLabel":"进入今日项目"},{"id":"wandering","label":"随便逛逛","reply":"不设目标也可以，让真实内容之间的关系带路。","target":"play","actionLabel":"打开今日知识星图"}]}')
  ),
  `updated_at` = '2026-07-23T10:18:00Z'
WHERE `key` = 'profile';
