UPDATE `site_settings`
SET
  `value` = json_set(
    `value`,
    '$.home',
    json('{"eyebrow":"START HERE / VISITOR GUIDE","title":"第一次来，可以从这里开始","description":"不必按导航顺序浏览。先读一篇代表性的文章、查看正在构建的项目，或通过主题与知识星图进入你感兴趣的方向。","writingLabel":"代表文章","projectsLabel":"正在构建","topicsLabel":"按主题进入","playgroundLabel":"可玩的知识网络","continueLabel":"继续上次未读完的文章"}'),
    '$.hero.intro.duration', 2200
  ),
  `updated_at` = '2026-07-23T09:05:00Z'
WHERE `key` = 'profile';
