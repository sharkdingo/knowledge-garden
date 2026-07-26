UPDATE `site_settings`
SET
  `value` = json_set(
    `value`,
    '$.hero.intro.replayLabel', '重播开场',
    '$.playground',
    json('{"intro":{"eyebrow":"PLAYGROUND / KNOWLEDGE MAP","title":"知识星图","description":"从真实文章与标签中寻找隐藏关系。这里不是外接小游戏，而是可以游玩的个人知识网络。"},"lead":"每日题目由当前内容图谱生成；进度只保存在当前设备。","constellation":{"id":"knowledge-constellation","eyebrow":"DAILY QUEST / KNOWLEDGE GRAPH","title":"连接今天的知识星图","description":"选择一篇文章，再选择一个真正属于它的概念。正确关系会点亮图谱，错误关系会累积噪声。","instructions":"先选择文章节点，再连接概念节点；在噪声耗尽前找出全部真实关系。","articleCount":4,"connectionsPerArticle":2,"noiseBudget":3,"startLabel":"生成今日星图","completeTitle":"知识星图已点亮","completeMessage":"全部真实关系已经恢复，今天的阅读入口已解锁。","secret":"你找到的不是一组孤立标签，而是一条从内容走向理解的路径。真正的彩蛋，是文章之间开始彼此照亮。"}}')
  ),
  `updated_at` = '2026-07-23T08:35:00Z'
WHERE `key` = 'profile';
