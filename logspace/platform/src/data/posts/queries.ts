// Posts as pages read them: the read side for posts. Every read queries the database, and
// presents what it finds (media URLs, image sizes and versions, captions rendered to HTML).
import { Context, Effect, Layer } from 'effect'
import { SqlClient } from 'effect/sql'

import type { ImageInfo } from '../../lib/image-widths.ts'
import { MediaStorage, mediaKeys } from '../../lib/media-storage.ts'
import { urls } from '../../lib/urls.ts'
import { isPostId, type PostCursor, type PostRecord } from './post.ts'
import { toPost, type Post } from './presentation.ts'
import { fromPostRow, POST_COLUMNS, type PostRow } from './rows.ts'

type ImageRow = ImageInfo & { readonly post_id: string; readonly name: string }

// How many posts a page of the feed shows.
export const PAGE_SIZE = 50

// A page of the feed, newest first, and the cursors of the pages either side of it: every page is
// the posts before a cursor, apart from the newest, which is the home page's. The older page's
// cursor is this page's last post; the newer page's is the post just above that page.
export interface PostsPage {
  readonly posts: readonly Post[]
  readonly newer?: PostCursor | 'newest' | undefined
  readonly older?: PostCursor | undefined
}

export class PostQueries extends Context.Service<
  PostQueries,
  {
    // Every post, newest first.
    readonly all: Effect.Effect<readonly Post[]>
    // The newest page of posts, or the one before a cursor. Undefined when the cursor's page
    // isn't one of its own: nothing's before the cursor, or nothing's after it (so its page is the
    // newest).
    readonly page: (before?: PostCursor) => Effect.Effect<PostsPage | undefined>
    // A post, with its files at `fileUrl`: the site's own URLs, or full ones, for an email.
    readonly find: (
      id: string,
      fileUrl?: (id: string, file: string) => string,
    ) => Effect.Effect<Post | undefined>
    // A post as it's stored, for the composer to edit.
    readonly findRecord: (id: string) => Effect.Effect<PostRecord | undefined>
    // The size and version of one of a post's images, if it's one.
    readonly imageInfo: (id: string, name: string) => Effect.Effect<ImageInfo | undefined>
    // A post that may not be published yet, as the composer previews it: its files are served
    // from /admin, with their sizes and versions.
    readonly preview: (record: PostRecord) => Effect.Effect<Post>
    // The names of a post's files in media storage, published or not, so the composer gives a
    // new one a name of its own.
    readonly fileNames: (id: string) => Effect.Effect<string[]>
  }
>()('logspace/PostQueries') {
  static readonly layer = Layer.effect(
    PostQueries,
    Effect.gen(function* () {
      let sql = yield* SqlClient.SqlClient
      let storage = yield* MediaStorage

      // The images of these posts, or of every post.
      let selectImages = (ids?: readonly string[]) =>
        sql<ImageRow>`select post_id, name, width, height, version from post_images ${
          ids === undefined ? sql`` : sql`where ${sql.in('post_id', ids)}`
        }`

      // Posts presented with their images' sizes and versions.
      let present = (
        rows: readonly PostRow[],
        imageRows: readonly ImageRow[],
        fileUrl = urls.postFile,
      ) => {
        let images = new Map(
          imageRows.map(({ post_id, name, width, height, version }) => [
            mediaKeys.postFile(post_id, name),
            { width, height, version },
          ]),
        )
        return rows.map((row) => {
          let record = fromPostRow(row)
          return toPost(record, (file) => images.get(mediaKeys.postFile(record.id, file)), fileUrl)
        })
      }

      let all = Effect.all(
        [
          sql<PostRow>`select ${sql.literal(POST_COLUMNS)} from posts order by date desc, id desc`,
          selectImages(),
        ],
        { concurrency: 'unbounded' },
      ).pipe(
        Effect.map(([rows, imageRows]) => present(rows, imageRows)),
        Effect.orDie,
        Effect.withSpan('PostQueries.all'),
      )

      // Posts are in order of (date, id), which posts_by_date indexes (see db/migrations).
      let page = Effect.fn('PostQueries.page')(function* (before?: PostCursor) {
        // One more post than the page shows, to tell whether there are older ones.
        let rows = yield* sql<PostRow>`
          select ${sql.literal(POST_COLUMNS)} from posts
          ${before ? sql`where (date, id) < (${before.date}, ${before.id})` : sql``}
          order by date desc, id desc limit ${PAGE_SIZE + 1}
        `
        // The newer page's posts, and one more: the post just above them, its cursor.
        let newer = before
          ? yield* sql<PostCursor>`
              select date, id from posts where (date, id) >= (${before.date}, ${before.id})
              order by date, id limit ${PAGE_SIZE + 1}
            `
          : []
        if (before && (rows.length === 0 || newer.length === 0)) return undefined
        let posts = rows.slice(0, PAGE_SIZE)
        let imageRows = yield* selectImages(posts.map((post) => post.id))
        return {
          posts: present(posts, imageRows),
          newer: newer.length === 0 ? undefined : (newer[PAGE_SIZE] ?? ('newest' as const)),
          older: rows.length > PAGE_SIZE ? posts.at(-1) : undefined,
        }
      }, Effect.orDie)

      let selectPost = (id: string) =>
        sql<PostRow>`select ${sql.literal(POST_COLUMNS)} from posts where id = ${id}`

      let find = Effect.fn('PostQueries.find')(function* (
        id: string,
        fileUrl?: (id: string, file: string) => string,
      ) {
        let [rows, imageRows] = yield* Effect.all([selectPost(id), selectImages([id])], {
          concurrency: 'unbounded',
        }).pipe(Effect.orDie)
        return present(rows, imageRows, fileUrl)[0]
      })

      let findRecord = Effect.fn('PostQueries.findRecord')(function* (id: string) {
        let [row] = yield* Effect.orDie(selectPost(id))
        return row && fromPostRow(row)
      })

      let imageInfo = Effect.fn('PostQueries.imageInfo')(function* (id: string, name: string) {
        let [info] = yield* sql<ImageInfo>`
          select width, height, version from post_images where post_id = ${id} and name = ${name}
        `.pipe(Effect.orDie)
        return info
      })

      let preview = Effect.fn('PostQueries.preview')(function* (record: PostRecord) {
        let imageRows = yield* Effect.orDie(selectImages([record.id]))
        let images = new Map(imageRows.map((row) => [row.name, row]))
        return toPost(record, (file) => images.get(file), urls.admin.postFile)
      })

      return PostQueries.of({
        all,
        page,
        find,
        findRecord,
        imageInfo,
        preview,
        fileNames: (id) => {
          // Storage keys are built only from checked ids.
          if (!isPostId(id)) return Effect.succeed([])
          let folder = mediaKeys.postFiles(id)
          return Effect.map(storage.list(folder), (files) =>
            files.map((file) => file.key.slice(folder.length)),
          )
        },
      })
    }),
  )
}
