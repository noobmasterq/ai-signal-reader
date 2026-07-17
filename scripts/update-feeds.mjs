import { readFile, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import Parser from 'rss-parser'
import pLimit from 'p-limit'
import { sources } from './sources.mjs'
import {
  discoverLinks,
  looksLikeFeed,
  mergeArticles,
  normalizeArticle,
  normalizeUrl,
  openGraphImage,
  scrapeItemsFromHtml,
  youtubeFeedFromHtml,
} from './feed-utils.mjs'

const ROOT = process.cwd()
const DATA_DIR = path.join(ROOT, 'public', 'data')
const ARTICLES_FILE = path.join(DATA_DIR, 'articles.json')
const STATUS_FILE = path.join(DATA_DIR, 'source-status.json')
const REQUEST_TIMEOUT_MS = 12_000
const parser = new Parser({
  timeout: REQUEST_TIMEOUT_MS,
  customFields: {
    item: [
      ['content:encoded', 'contentEncoded'],
      ['dc:creator', 'creator'],
      ['media:content', 'mediaContent', { keepArray: true }],
      ['media:thumbnail', 'mediaThumbnail', { keepArray: true }],
    ],
  },
})

async function readJson(file, fallback) {
  try {
    return JSON.parse(await readFile(file, 'utf8'))
  } catch {
    return fallback
  }
}

async function fetchText(url, { attempts = 2, timeout = REQUEST_TIMEOUT_MS } = {}) {
  let lastError
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'user-agent': 'Mozilla/5.0 (compatible; AI-Signal-RSS-Reader/1.0; +https://github.com/)',
          accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.9, */*;q=0.5',
        },
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return { text: await response.text(), url: response.url || url }
    } catch (error) {
      lastError = error
      if (attempt + 1 < attempts) await new Promise((resolve) => setTimeout(resolve, 450 * (attempt + 1)))
    } finally {
      clearTimeout(timer)
    }
  }
  throw lastError
}

async function parseFeedUrl(url) {
  const response = await fetchText(url)
  if (!looksLikeFeed(response.text)) throw new Error('返回内容不是 RSS 或 Atom')
  return { feed: await parser.parseString(response.text), feedUrl: response.url }
}

function commonFeedCandidates(siteUrl) {
  const site = new URL(siteUrl)
  const pageBase = site.pathname.endsWith('/') ? site.href : new URL('.', site).href
  const root = site.origin
  return [...new Set([
    new URL('feed.xml', pageBase).href,
    new URL('rss.xml', pageBase).href,
    new URL('atom.xml', pageBase).href,
    new URL('index.xml', pageBase).href,
    `${root}/feed/`,
    `${root}/feed.xml`,
    `${root}/rss.xml`,
    `${root}/atom.xml`,
    `${root}/index.xml`,
  ])]
}

async function discoverFeed(source) {
  const tried = new Set()
  const tryCandidate = async (url) => {
    const normalized = normalizeUrl(url)
    if (!normalized || tried.has(normalized)) return null
    tried.add(normalized)
    try {
      return await parseFeedUrl(normalized)
    } catch {
      return null
    }
  }

  if (source.feedUrl) {
    const direct = await tryCandidate(source.feedUrl)
    if (direct) return direct
  }

  let page
  try {
    page = await fetchText(source.siteUrl)
    if (looksLikeFeed(page.text)) {
      return { feed: await parser.parseString(page.text), feedUrl: page.url }
    }
  } catch {
    page = null
  }

  if (page) {
    const discovered = discoverLinks(page.text, page.url)
    const youtube = source.siteUrl.includes('youtube.com') ? youtubeFeedFromHtml(page.text) : null
    for (const candidate of [youtube, ...discovered]) {
      if (!candidate) continue
      const result = await tryCandidate(candidate)
      if (result) return result
    }
  }

  for (const candidate of commonFeedCandidates(page?.url ?? source.siteUrl)) {
    const result = await tryCandidate(candidate)
    if (result) return result
  }
  throw new Error(`未发现可解析的 RSS/Atom（尝试 ${tried.size} 个地址）`)
}

async function fetchSource(source, previousStatus, fetchedAt) {
  const startedAt = Date.now()
  try {
    let items
    let feedUrl
    let method = 'feed'
    try {
      const result = await discoverFeed(source)
      items = result.feed.items ?? []
      feedUrl = result.feedUrl
    } catch (feedError) {
      const page = await fetchText(source.siteUrl)
      items = scrapeItemsFromHtml(page.text, page.url)
      feedUrl = page.url
      method = 'html'
      if (!items.length) throw feedError
    }
    const articles = items
      .slice(0, 35)
      .map((item) => normalizeArticle(item, source, fetchedAt))
      .filter(Boolean)
    if (!articles.length) throw new Error('Feed 中没有可用文章')
    return {
      articles,
      status: {
        sourceId: source.id,
        sourceName: source.name,
        siteUrl: source.siteUrl,
        feedUrl,
        method,
        category: source.category,
        color: source.color,
        colorAlt: source.colorAlt,
        status: 'ok',
        itemCount: articles.length,
        lastSuccessAt: fetchedAt,
        checkedAt: fetchedAt,
        durationMs: Date.now() - startedAt,
        error: null,
      },
    }
  } catch (error) {
    return {
      articles: [],
      status: {
        sourceId: source.id,
        sourceName: source.name,
        siteUrl: source.siteUrl,
        feedUrl: previousStatus?.feedUrl ?? source.feedUrl ?? null,
        method: previousStatus?.method ?? null,
        category: source.category,
        color: source.color,
        colorAlt: source.colorAlt,
        status: previousStatus?.lastSuccessAt ? 'stale' : 'error',
        itemCount: 0,
        lastSuccessAt: previousStatus?.lastSuccessAt ?? null,
        checkedAt: fetchedAt,
        durationMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
      },
    }
  }
}

async function enrichImages(articles) {
  const candidates = articles.filter((article) => !article.imageUrl).slice(0, 80)
  const limit = pLimit(6)
  await Promise.all(candidates.map((article) => limit(async () => {
    try {
      const page = await fetchText(article.url, { attempts: 1, timeout: 8_000 })
      article.imageUrl = openGraphImage(page.text, page.url)
    } catch {
      article.imageUrl = null
    }
  })))
}

async function main() {
  await mkdir(DATA_DIR, { recursive: true })
  const previousData = await readJson(ARTICLES_FILE, { articles: [] })
  const previousStatuses = await readJson(STATUS_FILE, [])
  const previousStatusMap = new Map(previousStatuses.map((status) => [status.sourceId, status]))
  const fetchedAt = new Date().toISOString()
  const limit = pLimit(5)

  const results = await Promise.all(sources.map((source) => limit(async () => {
    const result = await fetchSource(source, previousStatusMap.get(source.id), fetchedAt)
    const mark = result.status.status === 'ok' ? '✓' : '×'
    console.log(`${mark} ${source.name}: ${result.status.itemCount} 篇${result.status.error ? ` · ${result.status.error}` : ''}`)
    return result
  })))

  const incoming = results.flatMap((result) => result.articles)
  await enrichImages(incoming)
  const articles = mergeArticles(previousData.articles ?? [], incoming, new Date(fetchedAt))
  const statuses = results.map((result) => result.status)
  const sourcesOk = statuses.filter((status) => status.status === 'ok').length
  const sourceErrors = statuses.length - sourcesOk

  const payload = {
    generatedAt: fetchedAt,
    timezone: 'Asia/Hong_Kong',
    totalArticles: articles.length,
    sourcesConfigured: sources.length,
    sourcesOk,
    sourceErrors,
    articles,
  }

  await writeFile(ARTICLES_FILE, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
  await writeFile(STATUS_FILE, `${JSON.stringify(statuses, null, 2)}\n`, 'utf8')
  console.log(`完成：${articles.length} 篇文章，${sourcesOk}/${sources.length} 个来源更新成功。`)

  if (!articles.length) {
    throw new Error('没有可发布的文章数据')
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
