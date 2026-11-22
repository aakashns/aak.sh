// The composer, where posts are written and edited, as they'll look. Its toolbar is the navbar: a
// back arrow that discards the post (once that's confirmed), the page's name, and on the right the
// buttons that add photos or a video, the theme toggle, and Post. Below is the post as its page
// shows it: the date, the caption, its photos or video (each with a button to remove it), and the
// card for its first link. Photos can also be pasted or dropped anywhere on the page. Files are
// uploaded as they're added, but nothing is saved until it's posted: closing the page loses it.
//
// Datastar runs it with one-line attributes, like the buttons in ../controls.tsx. The parts the
// server re-renders have ids: the issues, media, and toolbar, which it replaces whole (so the
// file inputs start empty again), and the inside of the link card, which Datastar morphs into
// place (so its image doesn't flicker as you type). `_uploading` is set by data-indicator on
// whatever is uploading; while it is, Post is off and the link card waits, since asking for one
// posts the whole form, chosen files and all. The navbar is outside the form, so its inputs and
// buttons join it with `form`, and Datastar is pointed at the form by its id. Posting is the
// form's own submission, so without Datastar it's a plain form, whose files are uploaded when
// it's posted.
import type { Child, Html } from '#jsx/jsx-runtime'

import { ThemeToggle, Tooltip } from '../../../components/controls.tsx'
import {
  ArrowLeftIcon,
  CloseIcon,
  ImageIcon,
  TrashIcon,
  VideoIcon,
} from '../../../components/icons.tsx'
import { POST_STYLES, PostMedia } from '../../../components/post.tsx'
import { stylesheet } from '../../../components/stylesheet.ts'
import { Button } from '../../../components/ui/button.tsx'
import {
  DialogClose,
  DialogContent,
  DialogFooter,
  DIALOG_STYLES,
} from '../../../components/ui/dialog.tsx'
import type { PostIssue } from '../../../data/posts/post.ts'
import { formatPostDate } from '../../../data/posts/format.ts'
import type { LinkPreview, Post } from '../../../data/posts/presentation.ts'
import { urls } from '../../../lib/urls.ts'
import type { ComposeValues } from './form.ts'
import css from './page.css' with { type: 'text' }

// The link card is the post's own.
export const COMPOSE_PAGE_STYLES = POST_STYLES + DIALOG_STYLES + stylesheet(css)

export const COMPOSER_IDS = {
  issues: 'composer-issues',
  media: 'composer-media',
  tools: 'composer-tools',
  link: 'composer-link',
}

export interface ComposerProps {
  readonly values: ComposeValues
  // The post as it'd be posted now, its files served from /admin.
  readonly post: Post
  readonly linkPreview?: LinkPreview | undefined
  readonly siteUrl: string
  readonly issues?: readonly PostIssue[] | undefined
  // Whether the post is published, so this is an edit.
  readonly published: boolean
}

const COMPOSER_FORM = 'composer'
const UPDATE_MEDIA = `@post('${urls.admin.postMedia()}', {contentType: 'form', selector: '#${COMPOSER_FORM}'})`
const LINK_CARD = `@post('${urls.admin.postPreview()}', {contentType: 'form', selector: '#${COMPOSER_FORM}'})`
// Files pasted or dropped are put in the photo button's input and uploaded as if chosen with it,
// unless something is uploading. Text pasted or dropped has no files, so it's left alone, but a
// file dropped is kept from opening in the tab.
const ADD_FILES = (from: string) =>
  `!$_uploading && (el.files = ${from}.files).length && ${UPDATE_MEDIA}`
const DRAGGING_FILES = `evt.dataTransfer.types.includes('Files')`
const ACCEPT_FILES = `${DRAGGING_FILES} && evt.preventDefault()`
const DROP_HANDLERS = {
  'data-on:paste__window': ADD_FILES('evt.clipboardData'),
  'data-on:dragover__window': ACCEPT_FILES,
  'data-on:drop__window': `${ACCEPT_FILES}; ${ADD_FILES('evt.dataTransfer')}`,
}

export function ComposePage(props: ComposerProps): Html {
  let { values, published } = props
  return (
    <section class="composer-page">
      <form
        id={COMPOSER_FORM}
        method="post"
        action={urls.admin.savePost()}
        enctype="multipart/form-data"
        class="composer"
      >
        <input type="hidden" name="post_id" value={values.id} />
        <ComposerIssues issues={props.issues} />
        <ComposerMeta post={props.post} />
        <CaptionInput value={values.caption} />
        <ComposerMedia {...props} />
        <div id={COMPOSER_IDS.link}>
          <ComposerLinkCard {...props} />
        </div>
      </form>
      <DiscardDialog published={published} />
      {published ? <DeleteDialog id={values.id} /> : null}
      <DropOverlay />
    </section>
  )
}

// The navbar's contents on the composer's page (see Document's `navbar`).
export function ComposerNavbar(props: { published: boolean }): Html {
  let { published } = props
  return (
    <>
      <div class="composer-title">
        {/* Opens the dialogs with command/commandfor, which needs no JavaScript. */}
        <Button
          command="show-modal"
          commandfor={DISCARD_DIALOG}
          variant="ghost"
          size="icon-lg"
          aria-label={published ? 'Discard changes' : 'Discard post'}
        >
          <ArrowLeftIcon />
        </Button>
        <h1>{published ? 'Edit Post' : 'New Post'}</h1>
      </div>
      <div class="nav-actions">
        <ComposerTools />
        <ThemeToggle />
        {published ? (
          <Tooltip label="Delete post">
            <Button
              command="show-modal"
              commandfor={DELETE_DIALOG}
              variant="ghost"
              size="icon-lg"
              aria-label="Delete post"
            >
              <TrashIcon />
            </Button>
          </Tooltip>
        ) : null}
        <Button
          type="submit"
          form={COMPOSER_FORM}
          size="sm"
          class="post-button"
          data-attr:disabled="$_uploading"
        >
          {published ? 'Save' : 'Post'}
        </Button>
      </div>
    </>
  )
}

// The line at the top of the post, as its page shows it, without the link to the page or the
// share button, since a new post has no page yet. A new post is dated when the composer opened;
// it's dated again when it's posted.
function ComposerMeta(props: { post: Post }): Html {
  let { post } = props
  return (
    <header class="post-meta">
      <p>
        <time datetime={post.date}>{formatPostDate(post.date)}</time>
        {post.city ? ` · ${post.city}` : null}
      </p>
    </header>
  )
}

// Says files dragged over the page can be dropped anywhere on it, while they're over it. It covers
// the page, and its insides don't take the pointer, so it's only left when the drag leaves the
// window or is cancelled. Not while something is uploading, since drops are ignored then.
function DropOverlay(): Html {
  return (
    <div
      hidden
      aria-hidden="true"
      class="drop-overlay"
      data-attr:hidden="!$_dragging"
      data-on:dragenter__window={`!$_uploading && ${DRAGGING_FILES} && ($_dragging = true)`}
      data-on:dragleave="$_dragging = false"
      data-on:drop__window="$_dragging = false"
    >
      <ImageIcon />
      <p>Drop photos to add them</p>
    </div>
  )
}

// Grows with what's typed, and reads as the caption will (see .composer-text). While typing, the
// link card follows at most every 100 ms, and once more after the last keystroke; a newer request
// cancels one still on its way. A modifier's dot can't be in a JSX attribute's name, so the handler is spread in.
function CaptionInput(props: { value: string }): Html {
  return (
    // A textarea drops a newline right after its start tag, so one goes there, and a value that
    // starts with a newline keeps it.
    <textarea
      name="caption"
      rows={3}
      aria-label="Caption"
      placeholder="What’s happening?"
      autofocus
      class="composer-text"
      {...{ 'data-on:input__throttle.100ms.trailing': `$_uploading || ${LINK_CARD}` }}
    >
      {`\n${props.value}`}
    </textarea>
  )
}

// Why the post wasn't published, or why files weren't added.
export function ComposerIssues(props: { issues?: readonly PostIssue[] | undefined }): Html {
  let { issues = [] } = props
  return (
    <div id={COMPOSER_IDS.issues}>
      {issues.length > 0 ? (
        <div role="alert" class="alert">
          <ul>
            {issues.map((issue) => (
              <li>{issue.message}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

// The post's media as its page shows it, with buttons to remove each, and the hidden fields that
// hold it.
export function ComposerMedia(props: ComposerProps): Html {
  let { values, post } = props
  return (
    <div id={COMPOSER_IDS.media} class="composer-media">
      {post.type === 'photos' ? (
        <PostMedia
          post={post}
          photoControls={(index) => {
            let file = values.photos[index] ?? post.photos[index]?.alt ?? ''
            return <RemoveButton file={file} label={`Remove ${file}`} />
          }}
        />
      ) : null}
      {post.type === 'video' && values.video ? (
        <div class="composer-video">
          <PostMedia post={post} />
          <RemoveButton file={values.video} label={`Remove ${values.video}`} />
        </div>
      ) : null}
      {post.type === 'video' && values.video ? (
        values.poster ? (
          <p class="muted">
            Poster image: {values.poster}{' '}
            <RemoveButton file={values.poster} label="Remove it" text />
          </p>
        ) : (
          <p class="muted">
            Without a poster image, phones show a black box until the video plays. Add one with the
            photo button.
          </p>
        )
      ) : null}
      {values.photos.map((file) => (
        <input type="hidden" name="photo" value={file} />
      ))}
      {values.video ? <input type="hidden" name="video" value={values.video} /> : null}
      {values.poster ? <input type="hidden" name="poster" value={values.poster} /> : null}
    </div>
  )
}

// Takes one file out of the post: a round × over its tile, or with `text`, the label as a link.
// It needs Datastar; without it, media can only be added.
function RemoveButton(props: { file: string; label: string; text?: boolean | undefined }): Html {
  let { file, label, text } = props
  return (
    <button
      type="button"
      name="remove"
      value={file}
      aria-label={text ? undefined : label}
      title={text ? undefined : label}
      class={text ? 'link-button' : 'remove-button'}
      data-on:click={UPDATE_MEDIA}
      data-indicator:_uploading
    >
      {text ? label : <CloseIcon />}
    </button>
  )
}

// The navbar's buttons that add media, and a spinner while they upload. They're the same for every
// post, so they can always be sent again to empty their file inputs: with a video, the photo button adds its poster, and the video
// button replaces it. Photos pasted or dropped go through the photo button.
export function ComposerTools(): Html {
  return (
    <div id={COMPOSER_IDS.tools} class="composer-tools">
      <MediaPicker label="Add photos" name="image_uploads" accept="image/*" multiple takesDrops>
        <ImageIcon />
      </MediaPicker>
      <MediaPicker label="Add a video" name="video_upload" accept="video/*">
        <VideoIcon />
      </MediaPicker>
      <span role="status" hidden class="uploading" data-attr:hidden="!$_uploading">
        <span class="spinner" aria-hidden="true" />
        <span class="visually-hidden">Uploading…</span>
      </span>
    </div>
  )
}

// An icon button that chooses files, which are uploaded right away. It looks like the navbar's
// other buttons, though it's a label, so clicking it opens its input's file picker.
function MediaPicker(props: {
  label: string
  name: string
  accept: string
  multiple?: boolean | undefined
  // Whether files pasted or dropped on the page are added with it.
  takesDrops?: boolean | undefined
  children: Child
}): Html {
  let { label, name, accept, multiple, takesDrops, children } = props
  return (
    <Tooltip label={label}>
      <label data-slot="button" data-variant="ghost" data-size="icon-lg" class="tool-button">
        {children}
        <input
          type="file"
          form={COMPOSER_FORM}
          name={name}
          accept={accept}
          multiple={multiple}
          aria-label={label}
          class="visually-hidden"
          data-on:change={UPDATE_MEDIA}
          data-indicator:_uploading
          {...(takesDrops ? DROP_HANDLERS : {})}
        />
      </label>
    </Tooltip>
  )
}

// A text post's card for its first link, as the feed will show it. Posts with media have none.
export function ComposerLinkCard(props: ComposerProps): Html {
  let { post, linkPreview } = props
  return (
    <>
      {post.type === 'text' && linkPreview ? <PostMedia post={post} preview={linkPreview} /> : null}
    </>
  )
}

const DISCARD_DIALOG = 'discard-post'

// Leaving the composer, from its back arrow, back to the list of posts: a new post is discarded,
// and an edit's changes. Discard posts the composer's form, to remove what was uploaded for it, so
// it's off while files upload.
function DiscardDialog(props: { published: boolean }): Html {
  let { published } = props
  return (
    <DialogContent
      id={DISCARD_DIALOG}
      title={published ? 'Discard your changes?' : 'Discard this post?'}
      description={
        published
          ? 'The post stays as it was published.'
          : 'What you’ve written and the files you’ve added are thrown away.'
      }
    >
      <DialogFooter>
        <DialogClose dialog={DISCARD_DIALOG} variant="outline" autofocus>
          Keep editing
        </DialogClose>
        <Button
          type="submit"
          form={COMPOSER_FORM}
          formaction={urls.admin.discardPost()}
          variant="destructive"
          data-attr:disabled="$_uploading"
        >
          Discard
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

const DELETE_DIALOG = 'delete-post'

// Deleting a post: a dialog to confirm, outside the composer's form, since forms can't nest.
function DeleteDialog(props: { id: string }): Html {
  return (
    <DialogContent
      id={DELETE_DIALOG}
      title="Delete this post?"
      description="It’s removed from the site right away, along with its media files, and this can’t be undone."
    >
      <form method="post" action={urls.admin.deletePost(props.id)}>
        <DialogFooter>
          <DialogClose dialog={DELETE_DIALOG} variant="outline" autofocus>
            Cancel
          </DialogClose>
          <Button type="submit" variant="destructive">
            Delete
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )
}
