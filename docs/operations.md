# 运维手册

## 本地启动

1. 复制 `.dev.vars.example` 为 `.dev.vars`，填写本地编辑者邮箱。
2. 执行 `npm run db:migrate` 初始化或升级本地 D1。
3. 执行 `npm run dev`。
4. 用 `npm run db:status` 检查迁移；用 `npm run db:backup` 导出本地 SQL。

全新数据从空内容开始。先进入 `/studio/categories` 创建分类，再创建文章。迁移不得通过手工编辑数据库替代。

## 发布前

- `npm run lint`
- `npm test`
- `npm run test:http`
- 检查 `/api/health` 返回 `status: ok`
- 从 Studio 下载一次 JSON 快照并确认文件可解析
- 确认生产编辑者白名单只包含预期账号

## 备份与恢复

Studio 的 `/studio/backup` 提供 JSON 导出与安全恢复。恢复必须先预演，核对各表数量，再输入与文件校验和绑定的确认代码；系统会在写入前自动保留当前快照。该能力用于内容可移植性和人工恢复演练，不替代 D1 平台快照。生产仍应至少每日保存平台备份，并定期在隔离环境运行 `npm run test:http` 验证从零迁移、创作、冲突、归档和恢复链路。

## 故障处理

- `migration-pending`：部署包与数据库迁移不同步，应用缺失迁移后再发布。
- `uninitialized`：D1 绑定错误、数据库未初始化，或某个文章/算法/恢复能力表缺失。
- 内容保存冲突：文章、题解、项目和站点设置都不会覆盖另一会话的新版本；刷新 Studio，比较后重新提交。
- 恢复失败：保留上传文件与自动生成的恢复点，不要反复提交；先检查健康状态和审计日志。
- 搜索不可用：公开内容仍可直接浏览；检查 D1 与 `/api/search`，不要让搜索故障阻断阅读。
