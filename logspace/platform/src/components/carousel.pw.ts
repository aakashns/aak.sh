// A post's photos (see PhotoCarousel in post.tsx): the arrows and dots in the feed, and the
// lightbox they open as, with the arrow keys and the keyboard's focus kept in it.
import type { Page } from '@playwright/test'
import { fileURLToPath } from 'node:url'

import { test, expect, openComposer } from '../../browser/fixtures.ts'

const photos = ['hike-1.jpg', 'hike-2.jpg', 'hike-3.jpg'].map((name) =>
  fileURLToPath(new URL(`../../test/content/posts/drdp3ei6fd/${name}`, import.meta.url)),
)

async function openPhotoFeed(page: Page) {
  await openComposer(page)
  let uploaded = page.waitForResponse((response) => response.url().endsWith('/media'))
  await page.getByLabel('Add photos', { exact: true }).setInputFiles(photos)
  expect((await uploaded).status()).toBe(200)
  await page.getByRole('button', { name: 'Post', exact: true }).click()
  await expect(page).toHaveURL(/\/posts\/[a-z0-9]{10}$/)
  await page.goto('/')
  // Datastar takes the nonce off the page once it's running.
  await expect(page.locator('html')).not.toHaveAttribute('data-nonce')
  return { carousel: page.locator('.carousel-inline'), lightbox: page.locator('dialog.carousel') }
}

test('the arrows step through the photos, and the arrow keys do in the lightbox', async ({
  page,
}) => {
  let { carousel, lightbox } = await openPhotoFeed(page)
  await carousel.getByRole('button', { name: 'Next photo' }).click()
  await expect(carousel).toHaveCSS('--index', '1')
  await carousel.getByRole('button', { name: 'Next photo' }).click()
  await expect(carousel).toHaveCSS('--index', '2')
  await carousel.getByRole('button', { name: 'Previous photo' }).click()
  await expect(carousel).toHaveCSS('--index', '1')
  let frame = page.locator('.carousel-frame')
  let height = (await frame.boundingBox())?.height

  await carousel.getByRole('button', { name: 'Open photo' }).nth(1).click()
  await expect(lightbox).toBeVisible()
  await expect(lightbox).toHaveCSS('--index', '1')
  expect((await frame.boundingBox())?.height).toBe(height)
  await expect(lightbox.locator('img').first()).toHaveAttribute('sizes', '100vw')
  await expect(lightbox.getByRole('button', { name: 'Close' })).toBeFocused()
  // The page behind is inert. (WebKit's Tab skips buttons, so it leaves the page instead.)
  for (let tab = 0; tab < 5; tab++) await page.keyboard.press('Tab')
  expect(
    await lightbox.evaluate(
      (el) => el.contains(document.activeElement) || document.activeElement === document.body,
    ),
  ).toBe(true)
  await page.keyboard.press('ArrowRight')
  await expect(lightbox).toHaveCSS('--index', '2')
  await page.keyboard.press('ArrowLeft')
  await expect(lightbox).toHaveCSS('--index', '1')

  await page.keyboard.press('Escape')
  await expect(lightbox).toBeHidden()
  await expect(carousel).toHaveCSS('--index', '1')
  expect(new URL(page.url()).pathname).toBe('/')
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true })

  test('the selected photo stays aligned after closing the lightbox', async ({ page }) => {
    let { carousel, lightbox } = await openPhotoFeed(page)
    let next = carousel.getByRole('button', { name: 'Next photo' })
    let feedTrack = carousel.locator('.carousel-track')
    let position = () =>
      feedTrack.evaluate((el) => ({
        offset: el.scrollLeft,
        width: el.getBoundingClientRect().width,
      }))

    await next.tap()
    await expect(carousel).toHaveCSS('--index', '1')
    let before = await position()
    let openSecond = carousel.getByRole('button', { name: 'Open photo' }).nth(1)
    // No frame should show the first slide while the second slide is being opened.
    let openPosition = await openSecond.evaluate((button) => {
      if (!(button instanceof HTMLButtonElement)) throw new Error('Missing photo button')
      let viewer = document.getElementById(button.getAttribute('commandfor') ?? '')
      let track = viewer?.querySelector('.carousel-track')
      if (!track) throw new Error('Missing viewer track')
      button.click()
      return track.scrollLeft - track.getBoundingClientRect().width
    })
    expect(openPosition).toBeCloseTo(0, 0)
    await lightbox.getByRole('button', { name: 'Close' }).tap()
    await expect(lightbox).toBeHidden()
    expect(await position()).toEqual(before)

    for (let attempt = 0; attempt < 2; attempt++) {
      await openSecond.tap()
      await expect(lightbox).toHaveCSS('--index', '1')
      expect(await position()).toEqual(before)
      await lightbox.getByRole('button', { name: 'Close' }).tap()
      await expect(lightbox).toBeHidden()
      expect(await position()).toEqual(before)
    }
    let slide = carousel.locator('.carousel-slide').nth(1)
    expect((await slide.boundingBox())?.x).toBeCloseTo((await feedTrack.boundingBox())?.x ?? NaN, 0)

    // Use the live offset when a swipe changes the photo right before closing.
    await openSecond.tap()
    await expect(lightbox).toHaveCSS('--index', '1')
    let closedOffset = await lightbox.getByRole('button', { name: 'Close' }).evaluate((button) => {
      let viewer = button.closest('.carousel')
      let track = viewer?.querySelector('.carousel-track')
      let feed = viewer?.previousElementSibling?.querySelector('.carousel-track')
      if (!track || !feed || !(button instanceof HTMLButtonElement))
        throw new Error('Missing carousel controls')
      track.scrollLeft = 0
      button.click()
      return feed.scrollLeft
    })
    expect(closedOffset).toBe(0)
    await expect(lightbox).toBeHidden()
    await expect(carousel).toHaveCSS('--index', '0')
  })
})
