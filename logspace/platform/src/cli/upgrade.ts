// `logspace upgrade [version] [--yes]`: replaces this binary with the latest release, or the given
// one, from GitHub, checked against the release's SHA256SUMS. That's all it does: restarting the
// server, which migrates the database when it starts, is left to whatever runs it.
import { Config, Console, Effect, FileSystem, Path } from 'effect'
import { Prompt } from 'effect/cli'
import { FetchHttpClient, HttpClient } from 'effect/http'

import { DOMAINS_FILE } from './deploy.ts'
import { fail, IS_BINARY, reportFailures, VERSION } from './shell.ts'

const RELEASES_URL = 'https://github.com/aakashns/aak.sh/releases'
const RELEASES_API = 'https://api.github.com/repos/aakashns/aak.sh/releases'
const releasesUrl = Config.String('LOGSPACE_RELEASES_URL').pipe(Config.withDefault(''))
const releasesApi = Config.String('LOGSPACE_RELEASES_API_URL').pipe(Config.withDefault(RELEASES_API))

// The platforms there's a release binary for, logspace-<platform>-<arch>.
const TARGETS = ['linux-x64', 'linux-arm64', 'darwin-x64', 'darwin-arm64']

export const upgrade = Effect.fn('upgrade')(
  function* (requested: string | undefined, yes: boolean) {
    if (!IS_BINARY) {
      return yield* fail(
        'upgrade replaces the built binary. In a checkout, pull and build instead.',
      )
    }
    let target = `${process.platform}-${process.arch}`
    if (!TARGETS.includes(target)) return yield* fail(`There are no releases for ${target}`)
    // A string with a default can't fail to read.
    let releases = yield* Effect.orDie(releasesUrl)

    let tag = requested ?? (releases ? yield* latestTag(releases) : yield* latestLogspaceTag())
    let version = tag.replace(/^(logspace-)?v/, '')
    if (!/^\d+\.\d+\.\d+$/.test(version)) return yield* fail(`Not a release: ${version}`)
    let order = compareVersions(version, VERSION)
    if (order === 0 || (order < 0 && requested === undefined)) {
      return yield* Console.log(`LogSpace ${VERSION} is up to date`)
    }
    if (order < 0) {
      return yield* fail(
        `${version} is older than ${VERSION}, and its server might not work with the database this one migrated`,
      )
    }

    let fs = yield* FileSystem.FileSystem
    let path = yield* Path.Path
    let binary = process.execPath
    yield* fs
      .access(path.dirname(binary), { writable: true })
      .pipe(
        Effect.mapError(() =>
          fail(`Can't replace ${binary}. Run it as a user who can, e.g. with sudo.`),
        ),
      )
    if (!yes) {
      let confirmed = yield* Prompt.run(
        Prompt.Confirm({ message: `Replace LogSpace ${VERSION} at ${binary} with ${version}?` }),
      ).pipe(Effect.catchTag('QuitError', () => Effect.succeed(false)))
      if (!confirmed) return yield* fail('Cancelled')
    }

    let asset = `logspace-${target}`
    let releaseUrl = releases
      ? `${releases}/download/v${version}`
      : `${RELEASES_URL}/download/logspace-v${version}`
    yield* Console.log(`Downloading ${releaseUrl}/${asset}...`)
    let sums = new TextDecoder().decode(yield* download(`${releaseUrl}/SHA256SUMS`))
    // sha256sum writes "<hash>  <name>", or "<hash> *<name>" for a file it read as binary.
    let expected = sums
      .split('\n')
      .map((line) => line.trim().split(/\s+\*?/))
      .find(([, name]) => name === asset)?.[0]
    if (!expected) return yield* fail(`${version}'s SHA256SUMS doesn't list ${asset}`)
    let bytes = yield* download(`${releaseUrl}/${asset}`)
    if (new Bun.CryptoHasher('sha256').update(bytes).digest('hex') !== expected) {
      return yield* fail(`The downloaded ${asset} doesn't match ${version}'s SHA256SUMS`)
    }

    // Written beside it and moved into place, so a running server keeps its copy.
    let tmp = `${binary}.${process.pid}.tmp`
    yield* Effect.gen(function* () {
      yield* fs.writeFile(tmp, bytes)
      yield* fs.chmod(tmp, 0o755)
      yield* fs.rename(tmp, binary)
    }).pipe(Effect.ensuring(fs.remove(tmp, { force: true }).pipe(Effect.orDie)))
    yield* Console.log(`Upgraded LogSpace ${VERSION} to ${version}`)
    yield* Console.log(
      (yield* fs.exists(DOMAINS_FILE))
        ? 'Run sudo logspace deploy to restart the service with it'
        : 'Restart LogSpace to run it',
    )
  },
  reportFailures,
  Effect.provide(FetchHttpClient.layer),
)

// The repository's latest release may belong to another project.
const latestLogspaceTag = Effect.fnUntraced(function* () {
  let api = yield* Effect.orDie(releasesApi)
  for (let page = 1; ; page++) {
    let url = `${api}?per_page=100&page=${page}`
    let bytes = yield* download(url)
    let releases = yield* Effect.try({
      try: (): unknown => JSON.parse(new TextDecoder().decode(bytes)),
      catch: () => fail(`Couldn't read the release list at ${url}`),
    }).pipe(Effect.catch((error) => error))
    if (!Array.isArray(releases)) return yield* fail(`Invalid release list at ${url}`)
    for (let release of releases) {
      let tag: unknown = release?.tag_name
      if (
        typeof tag === 'string' &&
        /^logspace-v\d+\.\d+\.\d+$/.test(tag) &&
        !release.prerelease &&
        !release.draft
      ) return tag
    }
    if (releases.length < 100) return yield* fail(`Couldn't find a LogSpace release at ${api}`)
  }
})

// The latest release's tag, from where GitHub sends /releases/latest (/releases/tag/<tag>).
const latestTag = Effect.fnUntraced(function* (releases: string) {
  let url = `${releases}/latest`
  let response = yield* (yield* HttpClient.HttpClient).get(url).pipe(
    Effect.provideService(FetchHttpClient.RequestInit, { redirect: 'manual' }),
    Effect.mapError((error) => fail(`Couldn't reach ${url}: ${error.message}`)),
  )
  let tag = /\/releases\/tag\/([^/?#]+)$/.exec(response.headers['location'] ?? '')?.[1]
  if (!tag) return yield* fail(`Couldn't find the latest release at ${url}`)
  return decodeURIComponent(tag)
})

const download = Effect.fnUntraced(function* (url: string) {
  let response = yield* (yield* HttpClient.HttpClient)
    .get(url)
    .pipe(Effect.mapError((error) => fail(`Couldn't reach ${url}: ${error.message}`)))
  if (response.status < 200 || response.status >= 300) {
    return yield* fail(`Couldn't download ${url}: HTTP ${response.status}`)
  }
  let body = yield* response.arrayBuffer.pipe(
    Effect.mapError((error) => fail(`Couldn't download ${url}: ${error.message}`)),
  )
  return new Uint8Array(body)
})

// Orders two versions like 0.12.3, both from release tags or package.json.
function compareVersions(a: string, b: string): number {
  let x = a.split('.').map(Number)
  let y = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    let difference = (x[i] ?? 0) - (y[i] ?? 0)
    if (difference !== 0) return difference
  }
  return 0
}
