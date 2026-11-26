// The home page: the site's introduction, and the newest posts, with links to pages of older
// ones, which are the home page with a cursor: /?before=… (see PostQueries.page).
import { Effect } from 'effect'
import { HttpRouter } from 'effect/http'

import { Document } from '../../components/document.tsx'
import { LinkPreviews } from '../../data/link-previews/link-previews.ts'
import { formatCursor, parseCursor } from '../../data/posts/post.ts'
import { getPriorityImage } from '../../data/posts/presentation.ts'
import { PostQueries } from '../../data/posts/queries.ts'
import { configuredSite } from '../../data/site/queries.ts'
import { getBannerSrcset, getSiteImageHref } from '../../data/site/site-images.ts'
import { subscriptionsStatus } from '../../data/site/subscriptions.ts'
import { pageContext, pageResponse, requestUrl } from '../../lib/http/pages.ts'
import { notFound, redirect } from '../../lib/http/responses.ts'
import { urls } from '../../lib/urls.ts'
import { BANNER_IMAGE_SIZES, HOME_PAGE_STYLES, HomePage } from './page.tsx'

const home = Effect.gen(function* () {
  let { searchParams } = yield* requestUrl
  let before = searchParams.get('before')
  let cursor = before === null ? undefined : parseCursor(before)
  if (before !== null && !cursor) return notFound()
  let feed = yield* (yield* PostQueries).page(cursor)
  // A page the cursor no longer leads to, after posts were deleted, or that's the newest.
  if (!feed) return redirect(urls.home())

  let page = yield* pageContext
  let site = yield* configuredSite
  let previews = yield* LinkPreviews
  let subscriptions = yield* subscriptionsStatus
  let { posts } = feed
  let { bannerImage } = site
  let bannerSrcset = bannerImage && getBannerSrcset(bannerImage)
  let items = yield* Effect.forEach(posts, (post) =>
    Effect.map(previews.forPost(post), (preview) => ({ post, preview })),
  )
  let newer =
    feed.newer === 'newest' ? urls.home() : feed.newer && urls.posts(formatCursor(feed.newer))
  let older = feed.older && urls.posts(formatCursor(feed.older))
  return pageResponse(
    page,
    <Document
      page={page}
      meta={
        before === null ? { path: urls.home() } : { path: urls.posts(before), title: 'Older posts' }
      }
      styles={HOME_PAGE_STYLES}
      // The banner, when there's one, is at the top, above the first post.
      preloadImage={
        bannerImage
          ? {
              href: getSiteImageHref(bannerImage),
              srcset: bannerSrcset || undefined,
              sizes: bannerSrcset ? BANNER_IMAGE_SIZES : undefined,
            }
          : posts[0] && getPriorityImage(posts[0])
      }
    >
      <HomePage
        site={site}
        items={items}
        subscribe={subscriptions._tag === 'Open'}
        newer={newer}
        older={older}
      />
    </Document>,
  )
})

export const IndexRoutes = HttpRouter.addAll([HttpRouter.route('GET', '/', home)])
