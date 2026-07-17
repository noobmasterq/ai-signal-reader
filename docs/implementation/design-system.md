# AI Signal 实现设计系统

视觉基准：`.superpowers/brainstorm/1161-1784277163/content/layout.html` 的 B 方案，以及 `card-treatment.html` 的 A 方案。图像生成于 2026-07-17 两次因网络错误失败，因此不作为阻塞条件。

## 可见文案锁定

首屏允许出现的主要文案：`AI Signal`、`今日更新`、当前日期、`刚刚更新`或实际更新时间、`搜索文章`、`全部`、`未读`、`收藏`、`来源`、`类别`。文章卡片只显示真实数据中的来源、标题、日期和摘要。

## 布局

- 页面最大宽度 1280px，桌面两侧留白 32–48px。
- 安静的顶部品牌行；标题、状态和控制区自然换行，不使用营销式 Hero。
- 文章流为有明确阅读顺序的编辑式 CSS Grid。第一篇为大头条，后续卡片采用两种尺寸形成节奏。
- 手机端为单列，详情层全屏，筛选层从底部展开。

## 颜色与材质

- 浅色背景 `#f5f5f7`，卡片 `#ffffff`，正文 `#1d1d1f`，弱文字 `#6e6e73`。
- 深色背景 `#08080a`，卡片 `#17171a`，正文 `#f5f5f7`，弱文字 `#a1a1a6`。
- 边框使用 6%–10% 的当前文字色；阴影柔和、低饱和。
- 每个来源有稳定的主色和第二色；封面缺失时使用这两色的抽象渐变。

## 字体与尺寸

- 字体：`-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif`。
- 页面标题：48/52px，手机 34/38px，字重 720。
- 头条标题：30/34px；普通卡片标题：20/25px。
- 控件：14/18px，字重 600；元数据：12/16px。

## 组件

- `AppHeader`：品牌、日期、更新时间、搜索、分段控制、筛选和主题。
- `ArticleGrid`：编辑式网格和空状态。
- `ArticleCard`：feature、wide、standard 三种布局，统一收藏与已读状态。
- `ArticleDetail`：摘要详情、收藏、已读切换、阅读原文。
- `FilterSheet`：来源与类别筛选，手机端底部面板。
- `ThemeMenu`：跟随系统、浅色、深色。

## 图标

使用 Lucide 的 `Search`、`Bookmark`、`BookmarkCheck`、`SlidersHorizontal`、`Sun`、`Moon`、`Monitor`、`X`、`ExternalLink`、`CheckCircle2` 和 `Circle`。统一 1.8px 线宽，18–20px；图标按钮触控区域不小于 44px。

## 动效

- 卡片 hover 上移 3px，阴影增强；150–220ms。
- 详情层使用淡入和轻微上移；手机端从下方进入。
- 筛选结果使用透明度过渡。
- `prefers-reduced-motion` 下关闭位移和非必要过渡。
