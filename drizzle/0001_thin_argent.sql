CREATE INDEX `article_sections_order_idx` ON `article_sections` (`article_slug`,`sort_order`);--> statement-breakpoint
CREATE INDEX `articles_status_date_idx` ON `articles` (`status`,`published_at`);--> statement-breakpoint
CREATE INDEX `articles_category_idx` ON `articles` (`category_id`);--> statement-breakpoint
CREATE INDEX `navigation_location_order_idx` ON `navigation_items` (`location`,`sort_order`);--> statement-breakpoint
CREATE INDEX `projects_order_idx` ON `projects` (`sort_order`);--> statement-breakpoint

INSERT INTO `site_settings` (`key`, `value`, `updated_at`) VALUES (
  'profile',
  '{"identity":{"name":"sharkdingo 的知识花园","shortName":"sharkdingo","latinName":"sharkdingo","author":"sharkdingo","description":"记录软件架构、AI 工作流、IoT 实践与持续学习的个人知识花园。","url":"https://simple-site-0722.danyuxiang76236334.chatgpt.site","locale":"zh-CN"},"footer":{"statement":"© 2026 sharkdingo · 在持续学习中构建。"},"hero":{"eyebrow":"SHARKDINGO / KNOWLEDGE GARDEN","title":"把复杂的问题，写成清晰的路径。","lead":"我是 sharkdingo，一名关注软件架构、AI 工作流与 IoT 的开发者。这里不陈列结论，而是保存问题如何被理解、系统如何被构建。","image":"/images/hero-knowledge-garden.png","imageAlt":"星空下的数据网络流过山谷与草原","caption":"知识不是孤立的节点，而是不断延伸的路径。","primaryAction":{"id":"writing","href":"/writing","label":"进入知识花园"},"secondaryAction":{"id":"projects","href":"/projects","label":"浏览项目"},"nowLabel":"NOW BUILDING","nowValue":"持续构建中","scrollLabel":"向下探索"},"pages":{"writing":{"eyebrow":"WRITING / INDEX","title":"文章","description":"关于 AI、软件系统、IoT 与工程实践的长期记录。"},"projects":{"eyebrow":"PROJECTS / BUILD LOG","title":"项目","description":"从真实问题出发，把需求、架构和验证过程做成可以运行的东西。"},"explore":{"eyebrow":"DISCOVERY / INDEX","title":"探索","description":"按主题、标签和时间寻找文章与项目。"}},"about":{"intro":{"eyebrow":"PERSON / NOTES","title":"关于我","description":"开发、学习、写作，以及把想法做成可靠产品的过程。"},"image":{"src":"/images/identity-landscape.png","alt":"由等高线、数据河和太阳构成的抽象个人标记"},"name":"sharkdingo","role":"开发者 · 学习者 · 创作者","bio":"喜欢写代码，也喜欢折腾各种有趣的想法。关注技术如何解决真实问题，长期在编程、工程系统与 AI 工作流之间游走。","quote":"把想法做成清晰、可靠的数字产品。","location":"Asia · UTC+8","socials":[{"label":"RSS","href":"/feed.xml"}],"journey":[{"title":"学习","description":"持续学习计算机科学与工程相关知识，关注系统设计、分布式与人工智能等领域。","period":"2016 — 至今"},{"title":"项目","description":"独立开发多个工具与应用，覆盖 IoT、平台、可视化等方向，从 0 到 1 把想法落地。","period":"2019 — 至今"},{"title":"近期方向","description":"构建更可靠的物联网验证平台，探索 AI 与工程化结合的工作流。","period":"2024 — 至今"}],"skills":[{"group":"Languages","items":["Java","TypeScript","Python"]},{"group":"Frameworks","items":["React","Node.js","Spring"]},{"group":"Interests","items":["AI 工具","IoT","可视化","知识管理"]}],"now":["优化物联网验证平台的稳定性、自动化与可观察性。","探索可靠的 AI 工作流，将工具、知识与工程实践更好地融合。"],"values":[{"symbol":"◎","title":"清晰","description":"先想清楚，再动手做。","note":"clarity over complexity"},{"symbol":"◇","title":"可靠","description":"质量来自细节与持续改进。","note":"reliability by design"},{"symbol":"○","title":"好奇","description":"保持开放，持续提问与学习。","note":"curiosity drives growth"}]},"theme":{"dark":{"bg":"#181a1b","surface":"#202326","surfaceStrong":"#292d30","text":"#c9cbcd","textStrong":"#f1f1ef","muted":"#9da1a4","faint":"#74797d","line":"#303438","lineStrong":"#454a4f","accent":"#43b58f","accentInk":"#10241d","danger":"#d78682","onImage":"#f7f8f5","onImageMuted":"#d3d8d5","imageOverlay":"#0d1414"},"light":{"bg":"#f7f7f4","surface":"#ffffff","surfaceStrong":"#eeefeb","text":"#4e5255","textStrong":"#181a1b","muted":"#686d71","faint":"#8a8f93","line":"#d9dbdc","lineStrong":"#b8bdc0","accent":"#147d62","accentInk":"#f4fffb","danger":"#a74f49","onImage":"#f7f8f5","onImageMuted":"#d3d8d5","imageOverlay":"#0d1414"}},"easterEggs":{"konami":{"title":"SIGNAL FOUND","message":"你找到了花园的隐藏信号。继续保持好奇。"},"brand":{"title":"HELLO, EXPLORER","message":"连续点击名字的人，通常也会发现系统里那些不明显的边界。","clicks":5},"console":{"greeting":"欢迎来到知识花园。试试 ↑ ↑ ↓ ↓ ← → ← → B A。"}}}',
  '2026-07-23T00:00:00Z'
);--> statement-breakpoint

INSERT INTO `navigation_items` (`id`, `location`, `href`, `label`, `sort_order`) VALUES
  ('home', 'header', '/', '首页', 10),
  ('writing', 'header', '/writing', '文章', 20),
  ('projects', 'header', '/projects', '项目', 30),
  ('about', 'header', '/about', '关于', 40),
  ('explore', 'header', '/explore', '探索', 50),
  ('footer-writing', 'footer', '/writing', '文章', 10),
  ('footer-projects', 'footer', '/projects', '项目', 20),
  ('footer-about', 'footer', '/about', '关于', 30),
  ('footer-rss', 'footer', '/feed.xml', 'RSS', 40);--> statement-breakpoint
