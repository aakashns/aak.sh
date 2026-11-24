// Pieces of a post shared by the feed and the post page.
import type { Array as Arr } from 'effect'

import { raw, type Html } from '#jsx/jsx-runtime'

import { formatPostDate } from '../data/posts/format.ts'
import {
  FULL_WIDTH_IMAGE_SIZES,
  type LinkPreview,
  type Photo,
  type Post,
  type Video,
} from '../data/posts/presentation.ts'
import { urls } from '../lib/urls.ts'
import { ShareButton } from './controls.tsx'
import { CaretLeftIcon, CaretRightIcon, CloseIcon } from './icons.tsx'
import css from './post.css' with { type: 'text' }
import { stylesheet } from './stylesheet.ts'
import { Button } from './ui/button.tsx'

// For the pages that show posts.
export const POST_STYLES = stylesheet(css)

// A small link preview card's thumbnail (see .small-card in post.css).
const LINK_THUMBNAIL_SIZES = '6.5rem'

// The line at the top of a post: date and time linking to the post's page, city, and a share
// button.
export function PostMeta(props: { post: Post; siteUrl: string }): Html {
  let { post } = props
  let href = urls.post(post.id)
  return (
    <header class="post-meta">
      <p>
        <a href={href} class="permalink">
          <time datetime={post.date}>{formatPostDate(post.date)}</time>
        </a>
        {post.city ? ` · ${post.city}` : null}
      </p>
      <ShareButton url={props.siteUrl + href} />
    </header>
  )
}

// The caption as HTML (see ../data/posts/caption.ts). Datastar ignores it, as it does all HTML made from
// what someone wrote.
export function Caption(props: { html: string }): Html {
  return (
    <div class="caption" data-ignore>
      {raw(props.html)}
    </div>
  )
}

// What goes under the caption: photos, a video, or a link preview.
export function PostMedia(props: {
  post: Post
  preview?: LinkPreview | undefined
  priority?: boolean | undefined
}): Html | null {
  let { post, preview, priority } = props
  switch (post.type) {
    case 'photos':
      return <PhotoCarousel id={`photos-${post.id}`} photos={post.photos} priority={priority} />
    case 'video':
      return <VideoPlayer video={post.video} />
    case 'text':
      return preview ? <LinkCard preview={preview} /> : null
  }
}

const trackWidth = (track: string) => `${track}.getBoundingClientRect().width`
const photoIndex = (track: string) => `Math.round(${track}.scrollLeft / ${trackWidth(track)})`
const scrollToPhoto = (track: string, index: string) =>
  `${track}.scrollTo({ left: (${index}) * ${trackWidth(track)}, behavior: 'instant' })`

const SHOW_INDEX = `el.parentElement.style.setProperty('--index', ${photoIndex('el')})`
// The show-modal command carries the index of the photo the user pressed.
const OPEN_AT_PHOTO =
  "evt.command === 'show-modal' && (el.dataset.index = evt.source.dataset.index)"
const SHOW_PHOTO = `evt.newState === 'open' && ${scrollToPhoto('el.firstElementChild', 'el.dataset.index')}`
// Capture the live offset before the dialog is hidden, even if a scroll event is still pending.
const NOTE_PHOTO = `evt.newState === 'closed' && (el.dataset.index = ${photoIndex('el.firstElementChild')})`
const FEED_TRACK = 'el.previousElementSibling.firstElementChild'
// Leave the feed's scroll position alone unless the user picked a different photo in the viewer.
const RETURN_TO_PHOTO = `+el.dataset.index !== ${photoIndex(FEED_TRACK)} && ${scrollToPhoto(FEED_TRACK, 'el.dataset.index')}`
// scrollTo snaps to the nearest slide. Safari's directional scrollBy can skip a slide.
const STEP = scrollToPhoto(
  'el.parentElement.firstElementChild',
  "+el.parentElement.style.getPropertyValue('--index') + +el.dataset.step",
)
const STEP_BY_KEY =
  "evt.key === el.getAttribute('aria-keyshortcuts') && el.parentElement.matches(':modal') && (evt.preventDefault(), el.click())"

// Give the feed and lightbox separate tracks. Resizing the feed track into a modal and back
// can leave Safari painting it at the fullscreen scroll offset after closing.
function PhotoCarousel(props: {
  id: string
  photos: Arr.NonEmptyReadonlyArray<Photo>
  priority?: boolean | undefined
}): Html {
  let { id, photos, priority } = props
  let many = photos.length > 1
  let aspectRatio = many ? undefined : displayAspectRatio(photos[0])
  return (
    <div
      class="carousel-frame"
      data-box={!aspectRatio}
      data-many={many}
      style={`--count: ${photos.length}${aspectRatio ? `; --aspect-ratio: ${aspectRatio}` : ''}`}
    >
      <div class="carousel carousel-inline">
        <PhotoTrack photos={photos} opener={id} priority={priority} />
        {many ? <CarouselNavigation count={photos.length} /> : null}
      </div>
      <dialog
        id={id}
        aria-label="Photos"
        class="carousel"
        data-on:command={many ? OPEN_AT_PHOTO : undefined}
        data-on:toggle={many ? SHOW_PHOTO : undefined}
        data-on:beforetoggle={many ? NOTE_PHOTO : undefined}
        data-on:close={many ? RETURN_TO_PHOTO : undefined}
      >
        <PhotoTrack photos={photos} />
        {many ? <CarouselNavigation count={photos.length} lightbox /> : null}
        <Button
          command="close"
          commandfor={id}
          autofocus
          variant="ghost"
          size="icon-lg"
          aria-label="Close"
          class="carousel-close"
        >
          <CloseIcon />
        </Button>
      </dialog>
    </div>
  )
}

function PhotoTrack(props: {
  photos: Arr.NonEmptyReadonlyArray<Photo>
  opener?: string | undefined
  priority?: boolean | undefined
}): Html {
  let { photos, opener, priority } = props
  return (
    <div class="carousel-track" data-on:scroll={photos.length > 1 ? SHOW_INDEX : undefined}>
      {photos.map((photo, index) => (
        <div class="carousel-slide">
          <PostImage
            photo={photo}
            priority={priority && index === 0}
            sizes={opener ? undefined : '100vw'}
          />
          {/* Reader views drop buttons and their contents, so overlay the button on the photo. */}
          {opener ? (
            <button
              type="button"
              command="show-modal"
              commandfor={opener}
              data-index={index}
              aria-label="Open photo"
              class="carousel-open"
            />
          ) : null}
        </div>
      ))}
    </div>
  )
}

function CarouselNavigation(props: { count: number; lightbox?: boolean }): Html {
  return (
    <>
      <StepButton step={-1} lightbox={props.lightbox} />
      <StepButton step={1} lightbox={props.lightbox} />
      <div class="carousel-dots" aria-hidden="true">
        {Array.from({ length: props.count }, () => (
          <span />
        ))}
      </div>
    </>
  )
}

function StepButton(props: { step: -1 | 1; lightbox?: boolean | undefined }): Html {
  let back = props.step === -1
  return (
    <Button
      variant="secondary"
      size="icon-sm"
      aria-label={back ? 'Previous photo' : 'Next photo'}
      aria-keyshortcuts={back ? 'ArrowLeft' : 'ArrowRight'}
      class="carousel-step"
      data-step={props.step}
      data-on:click={STEP}
      data-on:keydown__window={props.lightbox ? STEP_BY_KEY : undefined}
    >
      {back ? <CaretLeftIcon /> : <CaretRightIcon />}
    </Button>
  )
}

function VideoPlayer(props: { video: Video }): Html {
  let { video } = props
  let aspectRatio = displayAspectRatio(video)
  return (
    <video
      src={video.src}
      poster={video.poster}
      width={video.width}
      height={video.height}
      controls
      playsinline
      preload="metadata"
      style={aspectRatio ? `aspect-ratio: ${aspectRatio}` : undefined}
      class="media-frame video"
    />
  )
}

function LinkCard(props: { preview: LinkPreview }): Html {
  let { preview } = props
  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener"
      class={`media-frame link-preview${preview.smallImage ? ' small-card' : ''}`}
    >
      {preview.image ? (
        <PostImage
          photo={preview.image}
          sizes={preview.smallImage ? LINK_THUMBNAIL_SIZES : undefined}
          class="card-image"
        />
      ) : null}
      <div class="card-text">
        <span class="link-domain">{preview.domain}</span>
        {preview.title ? <h2>{preview.title}</h2> : null}
        {preview.description ? <p>{preview.description}</p> : null}
      </div>
    </a>
  )
}

// The first post's media loads right away; everything else waits until it's scrolled near. The
// browser picks the resized copy of the photo that fits `sizes` (full width by default).
function PostImage(props: {
  photo: Photo
  priority?: boolean | undefined
  sizes?: string | undefined
  class?: string | undefined
}): Html {
  let { photo, priority, sizes = FULL_WIDTH_IMAGE_SIZES } = props
  return (
    <img
      src={photo.src}
      srcset={photo.srcset}
      sizes={photo.srcset ? sizes : undefined}
      alt={photo.alt}
      width={photo.width}
      height={photo.height}
      loading={priority ? 'eager' : 'lazy'}
      fetchpriority={priority ? 'high' : undefined}
      decoding="async"
      class={props.class}
    />
  )
}

// Very tall media is cropped (photos) or letterboxed (videos) to 4:5 so one post can't fill the
// whole screen. Without a known size, the media keeps its natural shape.
function displayAspectRatio({
  width,
  height,
}: {
  width?: number | undefined
  height?: number | undefined
}) {
  return width && height ? String(Math.max(width / height, 4 / 5)) : undefined
}
