import crypto from 'node:crypto'
import * as cheerio from 'cheerio'
import sanitizeHtml from 'sanitize-html'

const TRACKING_PARAMS = /^(utm_.+|fbclid|gclid|mc_cid|mc_eid|ref|source)$/i

export function normalizeUrl(value, base) {
  if (!value || typeof value !== 'string') return null
  try {
    const url = base ? new URL(value.trim(), base) : new URL(value.trim())
    url.hash = ''
    for (const key of [...url.searchParams.keys()]) {
      if (TRACKING_PARAMS.test(key)) url.searchParams.delete(key)
    }
    if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, '')
    return url.href
  } catch {
    return null
  }
}

export function plainText(value, maxLength = 420) {
  if (!value || typeof value !== 'string') return ''
  const text = sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, ' ')
    .replace(/\u00a0/g, ' ')
    .trim()
  if (text.length <= maxLength) return text
  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`
}

export function parsePublishedAt(...values) {
  for (const value of values) {
    if (!value) continue
    const timestamp = Date.parse(value)
    if (Number.isFinite(timestamp)) return new Date(timestamp).toISOString()
  }
  return null
}

function readMediaUrl(node) {
  if (!node) return null
  if (Array.isArray(node)) {
    for (const value of node) {
      const found = readMediaUrl(value)
      if (found) return found
    }
    return null
  }
  if (typeof node === 'string') return node
  if (typeof node === 'object') return node.url ?? node.href ?? node.$?.url ?? node.$?.href ?? null
  return null
}

export function imageFromItem(item, articleUrl) {
  const direct = [
    item.enclosure?.url,
    readMediaUrl(item.mediaContent),
    readMediaUrl(item.mediaThumbnail),
    readMediaUrl(item['media:content']),
    readMediaUrl(item['media:thumbnail']),
    item.image?.url,
  ]
  for (const candidate of direct) {
    const normalized = normalizeUrl(candidate, articleUrl)
    if (normalized) return normalized
  }

  const html = item.contentEncoded ?? item['content:encoded'] ?? item.content ?? item.summary ?? ''
  if (html) {
    const $ = cheerio.load(html)
    const candidate = $('img').first().attr('src') ?? $('img').first().attr('data-src')
    return normalizeUrl(candidate, articleUrl)
  }
  return null
}

export function articleId(sourceId, url, guid = '') {
  return crypto.createHash('sha1').update(`${sourceId}|${url}|${guid}`).digest('hex').slice(0, 20)
}

export function normalizeArticle(item, source, fetchedAt) {
  const articleUrl = normalizeUrl(item.link ?? item.guid, source.siteUrl)
  const title = plainText(item.title, 180)
  if (!articleUrl || !title) return null
  const publishedAt = parsePublishedAt(item.isoDate, item.pubDate, item.published, item.updated)
  const summary = plainText(
    item.contentSnippet ?? item.summary ?? item.contentEncoded ?? item['content:encoded'] ?? item.content,
  )
  const guid = typeof item.guid === 'string' ? item.guid : ''
  return {
    id: articleId(source.id, articleUrl, guid),
    sourceId: source.id,
    sourceName: source.name,
    category: source.category,
    sourceColor: source.color,
    sourceColorAlt: source.colorAlt,
    title,
    url: articleUrl,
    author: plainText(item.creator ?? item.author ?? item['dc:creator'], 100),
    summary: summary || '暂无摘要，点击查看原文。',
    imageUrl: imageFromItem(item, articleUrl),
    publishedAt,
    dateUnknown: !publishedAt,
    fetchedAt,
  }
}

export function mergeArticles(previous, incoming, now = new Date()) {
  const byUrl = new Map()
  for (const article of [...incoming, ...previous]) {
    const key = normalizeUrl(article.url) ?? article.id
    if (!byUrl.has(key)) byUrl.set(key, article)
  }

  const cutoff = now.getTime() - 90 * 24 * 60 * 60 * 1000
  return [...byUrl.values()]
    .filter((article) => !article.publishedAt || Date.parse(article.publishedAt) >= cutoff)
    .sort((a, b) => {
      if (!a.publishedAt && !b.publishedAt) return a.title.localeCompare(b.title)
      if (!a.publishedAt) return 1
      if (!b.publishedAt) return -1
      return Date.parse(b.publishedAt) - Date.parse(a.publishedAt)
    })
    .slice(0, 1000)
}

export function looksLikeFeed(text) {
  return /<(rss|feed|rdf:RDF)(\s|>)/i.test(text.slice(0, 3000))
}

export function discoverLinks(html, pageUrl) {
  const $ = cheerio.load(html)
  const links = []
  $('link[rel="alternate"]').each((_, element) => {
    const type = ($(element).attr('type') ?? '').toLowerCase()
    if (!type.includes('rss') && !type.includes('atom') && !type.includes('xml')) return
    const href = normalizeUrl($(element).attr('href'), pageUrl)
    if (href) links.push(href)
  })
  return [...new Set(links)]
}

export function youtubeFeedFromHtml(html) {
  const channelId = html.match(/"channelId":"(UC[\w-]+)"/)?.[1]
    ?? html.match(/"externalId":"(UC[\w-]+)"/)?.[1]
    ?? html.match(/youtube\.com\/channel\/(UC[\w-]+)/)?.[1]
  return channelId ? `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}` : null
}

export function openGraphImage(html, pageUrl) {
  const $ = cheerio.load(html)
  const candidate = $('meta[property="og:image"]').attr('content')
    ?? $('meta[name="twitter:image"]').attr('content')
    ?? $('meta[property="twitter:image"]').attr('content')
  return normalizeUrl(candidate, pageUrl)
}

function flattenJsonLd(value, output) {
  if (!value) return
  if (Array.isArray(value)) {
    value.forEach((item) => flattenJsonLd(item, output))
    return
  }
  if (typeof value !== 'object') return
  const type = Array.isArray(value['@type']) ? value['@type'].join(' ') : value['@type']
  if (typeof type === 'string' && /(Article|BlogPosting|NewsArticle)/i.test(type)) output.push(value)
  if (value['@graph']) flattenJsonLd(value['@graph'], output)
  if (value.itemListElement) flattenJsonLd(value.itemListElement, output)
  if (value.item) flattenJsonLd(value.item, output)
}

function imageFromJsonLd(value) {
  const image = value?.image ?? value?.thumbnailUrl
  if (typeof image === 'string') return image
  if (Array.isArray(image)) return imageFromJsonLd({ image: image[0] })
  if (image && typeof image === 'object') return image.url ?? image.contentUrl ?? null
  return null
}

export function scrapeItemsFromHtml(html, pageUrl) {
  const $ = cheerio.load(html)
  const items = []
  const seen = new Set()
  const add = (item) => {
    const link = normalizeUrl(item.link, pageUrl)
    const title = plainText(item.title, 180)
    if (!link || !title || title.length < 6 || seen.has(link)) return
    seen.add(link)
    items.push({ ...item, link })
  }

  const jsonLdArticles = []
  $('script[type="application/ld+json"]').each((_, element) => {
    try {
      flattenJsonLd(JSON.parse($(element).text()), jsonLdArticles)
    } catch {
      // Ignore malformed structured data and continue with DOM extraction.
    }
  })
  for (const value of jsonLdArticles) {
    const mainEntity = typeof value.mainEntityOfPage === 'object' ? value.mainEntityOfPage['@id'] : value.mainEntityOfPage
    add({
      title: value.headline ?? value.name,
      link: value.url ?? mainEntity,
      pubDate: value.datePublished ?? value.dateModified,
      contentSnippet: value.description,
      creator: value.author?.name ?? value.author?.[0]?.name,
      enclosure: { url: imageFromJsonLd(value) },
    })
  }

  const containers = $('article, main [class*="post" i], main [class*="article" i], main [class*="card" i]').toArray()
  for (const container of containers) {
    const element = $(container)
    const heading = element.find('h2, h3').first()
    const anchor = heading.closest('a[href]').length ? heading.closest('a[href]') : element.find('a[href]').first()
    const time = element.find('time, [datetime]').first()
    add({
      title: heading.text(),
      link: anchor.attr('href'),
      pubDate: time.attr('datetime') ?? time.text(),
      contentSnippet: element.find('p').first().text(),
      enclosure: { url: element.find('img').first().attr('src') ?? element.find('img').first().attr('data-src') },
    })
  }

  if (items.length < 3) {
    $('main a[href]').has('h2, h3').each((_, anchor) => {
      const element = $(anchor)
      add({
        title: element.find('h2, h3').first().text(),
        link: element.attr('href'),
        contentSnippet: element.find('p').first().text(),
        enclosure: { url: element.find('img').first().attr('src') ?? element.find('img').first().attr('data-src') },
      })
    })
  }
  return items.slice(0, 35)
}
