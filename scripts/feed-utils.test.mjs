import { describe, expect, it } from 'vitest'
import {
  discoverLinks,
  mergeArticles,
  normalizeArticle,
  normalizeUrl,
  openGraphImage,
  parsePublishedAt,
  plainText,
  scrapeItemsFromHtml,
} from './feed-utils.mjs'

const source = {
  id: 'test', name: 'Test Source', siteUrl: 'https://example.com/', category: '测试',
  color: '#000000', colorAlt: '#ffffff',
}

describe('feed utilities', () => {
  it('removes tracking parameters and hashes', () => {
    expect(normalizeUrl('https://example.com/post/?utm_source=x&id=2#top')).toBe('https://example.com/post?id=2')
  })

  it('cleans and truncates HTML summaries', () => {
    expect(plainText('<p>Hello&nbsp; <strong>world</strong></p>', 20)).toBe('Hello world')
  })

  it('keeps unknown dates unknown', () => {
    expect(parsePublishedAt('not a date')).toBeNull()
  })

  it('normalizes an RSS item', () => {
    const article = normalizeArticle({ title: 'A post', link: '/post', pubDate: '2026-07-17T00:00:00Z' }, source, '2026-07-17T01:00:00Z')
    expect(article.url).toBe('https://example.com/post')
    expect(article.publishedAt).toBe('2026-07-17T00:00:00.000Z')
  })

  it('discovers alternate feed and Open Graph image links', () => {
    const html = '<link rel="alternate" type="application/rss+xml" href="/feed.xml"><meta property="og:image" content="/cover.jpg">'
    expect(discoverLinks(html, 'https://example.com/blog/')).toEqual(['https://example.com/feed.xml'])
    expect(openGraphImage(html, 'https://example.com/blog/')).toBe('https://example.com/cover.jpg')
  })

  it('extracts structured articles when a site has no feed', () => {
    const html = '<script type="application/ld+json">{"@type":"BlogPosting","headline":"A useful article","url":"/post","datePublished":"2026-07-17","description":"Summary"}</script>'
    expect(scrapeItemsFromHtml(html, 'https://example.com/blog/')[0]).toMatchObject({ title: 'A useful article', link: 'https://example.com/post' })
  })

  it('deduplicates and sorts known dates before unknown dates', () => {
    const articles = mergeArticles([], [
      { id: 'a', url: 'https://example.com/a', title: 'A', publishedAt: null },
      { id: 'b', url: 'https://example.com/b', title: 'B', publishedAt: '2026-07-16T00:00:00Z' },
      { id: 'b2', url: 'https://example.com/b?utm_source=x', title: 'B duplicate', publishedAt: '2026-07-16T00:00:00Z' },
    ], new Date('2026-07-17T00:00:00Z'))
    expect(articles.map((article) => article.id)).toEqual(['b', 'a'])
  })
})
