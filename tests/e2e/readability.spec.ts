import { expect, test, type Page } from '@playwright/test'

type FontCheck = {
  selector: string
  minimum: number
}

async function expectReadableFonts(page: Page, checks: FontCheck[]) {
  for (const check of checks) {
    const element = page.locator(check.selector).filter({ visible: true }).first()
    await expect(element, `${check.selector} should be visible`).toBeVisible()
    const size = await element.evaluate((node) => Number.parseFloat(getComputedStyle(node).fontSize))
    expect(size, `${check.selector} font size`).toBeGreaterThanOrEqual(check.minimum)
  }
}

const pageChecks: Array<{ path: string; checks: FontCheck[] }> = [
  {
    path: '/',
    checks: [
      { selector: '.brand small', minimum: 11 },
      { selector: '.section-kicker', minimum: 11 },
      { selector: '.foundation-grid p', minimum: 13 },
      { selector: '.footer span', minimum: 11 },
    ],
  },
  {
    path: '/install',
    checks: [
      { selector: '.installer-step small', minimum: 11 },
      { selector: '.check-row small', minimum: 12 },
      { selector: '.installer-intro', minimum: 13 },
    ],
  },
  {
    path: '/lab',
    checks: [
      { selector: '.lesson-mini-list strong', minimum: 13 },
      { selector: '.lesson-mini-list small', minimum: 12 },
      { selector: '.coach-card p', minimum: 13 },
      { selector: '.command-suggestions code', minimum: 12 },
      { selector: '.shortcut-list small', minimum: 11 },
      { selector: '.coach-boundary', minimum: 12 },
    ],
  },
  {
    path: '/commands',
    checks: [
      { selector: '.command-toolbar__result', minimum: 11 },
      { selector: '.command-card__name small', minimum: 11 },
      { selector: '.command-card__description', minimum: 12 },
      { selector: '.verification-badge', minimum: 11 },
    ],
  },
  {
    path: '/courses',
    checks: [
      { selector: '.course-index__header span', minimum: 11 },
      { selector: '.course-index__item small', minimum: 11 },
      { selector: '.lab-step__body > p', minimum: 13 },
      { selector: '.course-boundary ul', minimum: 12 },
    ],
  },
  {
    path: '/about',
    checks: [
      { selector: '.truth-card ul', minimum: 13 },
      { selector: '.architecture-flow p', minimum: 13 },
      { selector: '.privacy-grid p', minimum: 13 },
      { selector: '.roadmap-section li span', minimum: 12 },
    ],
  },
]

for (const entry of pageChecks) {
  test(`${entry.path} keeps learning hints readable`, async ({ page }) => {
    await page.goto(entry.path)
    await expect(page.locator('h1')).toBeVisible()
    await expectReadableFonts(page, entry.checks)
  })
}

test('main pages do not overflow the mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })

  for (const entry of pageChecks) {
    await page.goto(entry.path)
    await expect(page.locator('h1')).toBeVisible()
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(dimensions.scrollWidth, `${entry.path} horizontal overflow`).toBeLessThanOrEqual(dimensions.clientWidth + 1)
  }
})

test('lab terminal stays centered on desktop scrolling and static on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/lab')

  const terminal = page.locator('.terminal-card')
  await expect(terminal).toBeVisible()
  await expect(terminal).toHaveCSS('position', 'sticky')
  await page.evaluate(() => window.scrollTo(0, 500))
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0)

  const desktopBox = await terminal.boundingBox()
  expect(desktopBox).not.toBeNull()
  expect(desktopBox!.y).toBeGreaterThanOrEqual(88)
  expect(desktopBox!.y + desktopBox!.height).toBeLessThanOrEqual(900)
  expect(Math.abs(desktopBox!.y + desktopBox!.height / 2 - 450)).toBeLessThanOrEqual(36)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/lab')
  await expect(terminal).toHaveCSS('position', 'static')
})
