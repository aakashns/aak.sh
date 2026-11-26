import type { Html } from '#jsx/jsx-runtime'
import { CaretLeftIcon, CaretRightIcon, RssIcon } from '../../components/icons.tsx'
import { POST_STYLES } from '../../components/post.tsx'
import { stylesheet } from '../../components/stylesheet.ts'

import { Button } from '../../components/ui/button.tsx'
import { getBannerSrcset, getSiteImageHref } from '../../data/site/site-images.ts'
import type { SiteConfig } from '../../data/site/site.ts'
import { urls } from '../../lib/urls.ts'
import { Feed, type FeedItem } from './feed.tsx'
import css from './page.css' with { type: 'text' }

export const HOME_PAGE_STYLES = POST_STYLES + stylesheet(css)

// The home page's banner, which spans the screen on phones and the column with its padding on
// wider screens (see .banner in page.css).
export const BANNER_IMAGE_SIZES = '(min-width: 38rem) 38rem, 100vw'

// The banner and introduction set at /admin/branding, with a Subscribe button while subscribing
// is open and a link to the RSS feed, then the feed, then links to the pages of newer and older
// posts, if there are any. The banner, heading, and subheading can be left out.
export function HomePage(props: {
  site: SiteConfig
  items: readonly FeedItem[]
  subscribe: boolean
  newer?: string | undefined
  older?: string | undefined
}): Html {
  let { bannerImage, bannerImageAlt, heroHeading, heroSubheading, siteUrl } = props.site
  let srcset = bannerImage && getBannerSrcset(bannerImage)
  return (
    <>
      {bannerImage ? (
        <img
          src={getSiteImageHref(bannerImage)}
          srcset={srcset || undefined}
          sizes={srcset ? BANNER_IMAGE_SIZES : undefined}
          alt={bannerImageAlt}
          width={bannerImage.width}
          height={bannerImage.height}
          fetchpriority="high"
          class="banner"
        />
      ) : null}
      <section class="intro">
        {heroHeading ? <h1>{heroHeading}</h1> : null}
        {heroSubheading ? <p>{heroSubheading}</p> : null}
        <div class="intro-actions">
          {props.subscribe ? <Button href={urls.subscribe()}>Subscribe</Button> : null}
          <Button href={urls.rss()} variant="outline">
            <RssIcon />
            RSS
          </Button>
        </div>
      </section>
      <Feed items={props.items} siteUrl={siteUrl} />
      {props.newer || props.older ? (
        <nav aria-label="More posts" class="pagination">
          {props.newer ? (
            <Button href={props.newer} variant="outline" rel="prev">
              <CaretLeftIcon />
              Newer posts
            </Button>
          ) : null}
          {props.older ? (
            <Button href={props.older} variant="outline" rel="next" class="older">
              Older posts
              <CaretRightIcon />
            </Button>
          ) : null}
        </nav>
      ) : null}
    </>
  )
}
