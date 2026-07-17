# AI Signal

一个面向 AI 与机器学习内容的杂志式 RSS 阅读器。39 个订阅来源按发布时间倒序混排，支持站内摘要、阅读原文、搜索、来源与类别筛选、未读、收藏、浅色/深色/跟随系统主题，以及完整的手机版布局。

## 自动更新

GitHub Actions 每天香港时间 08:17 抓取一次全部信源，清洗并合并最近 90 天内的文章，然后重新部署 GitHub Pages。也可以在 Actions 页面手动运行 `Update feeds and deploy`。

个别网站可能临时不可访问；页面会显示最近一次抓取状态，并保留此前成功抓取的数据，不会用虚构文章填充。

## 本地运行

需要 Node.js 24。

```bash
npm ci
npm run update:feeds
npm run dev
```

完整校验：

```bash
npm test
npm run check
npm run build
```

## 数据与隐私

- 收藏、已读状态和主题偏好只保存在当前浏览器中。
- 摘要详情在站内打开；“阅读原文”会前往发布者网站。
- 抓取结果位于 `public/data/`，网站本身不需要数据库或服务器。
