# Terminal Sticky Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the Lab terminal near the vertical center of desktop and tablet viewports while the surrounding learning content scrolls.

**Architecture:** Preserve the existing React tree and terminal lifecycle. Implement the behavior entirely in the Lab layout CSS with sticky positioning and an explicit mobile reset, protected by a Playwright regression test that observes rendered geometry rather than source text.

**Tech Stack:** React 19, TypeScript, CSS, Vite, Playwright

## Global Constraints

- Sticky behavior applies only when the viewport width is greater than `820px`.
- Use the terminal card's `590px` baseline height to calculate its centered sticky offset.
- Preserve at least `88px` above the terminal so the `72px` sticky navigation cannot cover it.
- At widths of `820px` or less, the terminal remains in normal document flow.
- Do not add scroll listeners, change the React component tree, or remount either terminal implementation.

---

### Task 1: Protect the terminal scrolling behavior with an end-to-end test

**Files:**
- Modify: `tests/e2e/readability.spec.ts`

**Interfaces:**
- Consumes: the existing `/lab` route and `.terminal-card` selector.
- Produces: a browser-level contract for desktop sticky geometry and mobile static positioning.

- [ ] **Step 1: Add the failing desktop and mobile behavior test**

Append this test to `tests/e2e/readability.spec.ts`:

```ts
test('lab terminal stays centered on desktop scrolling and static on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/lab')

  const terminal = page.locator('.terminal-card')
  await expect(terminal).toBeVisible()
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
```

This catches removal of sticky positioning, a wrong top offset that hides the terminal, and accidental sticky behavior on mobile. The test scrolls within the Lab grid instead of to the document footer, where CSS sticky elements must correctly yield at their containing block boundary.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npx playwright test tests/e2e/readability.spec.ts --grep "lab terminal stays centered"
```

Expected: FAIL because the current `.terminal-card` has `position: static` and scrolls above the viewport.

### Task 2: Implement desktop sticky centering with a mobile reset

**Files:**
- Modify: `src/styles.css:1198-1201`
- Modify: `src/styles.css` inside the existing `@media (max-width: 820px)` block
- Test: `tests/e2e/readability.spec.ts`

**Interfaces:**
- Consumes: `.lab-layout`, `.terminal-card`, and the existing `820px` responsive breakpoint.
- Produces: CSS-only sticky placement without terminal component lifecycle changes.

- [ ] **Step 1: Apply the minimal desktop CSS**

Change the Lab layout and terminal card rules to:

```css
.lab-layout { display: grid; grid-template-columns: 220px minmax(480px, 1fr) 240px; gap: 12px; align-items: start; }

.terminal-card {
  position: sticky;
  top: max(88px, calc((100vh - 590px) / 2));
  height: 590px;
  align-self: start;
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 11px;
  background: var(--panel);
}
```

Keep `.lab-sidebar` in the shared visual rule, but do not give it sticky positioning.

- [ ] **Step 2: Disable sticky positioning on mobile**

Inside `@media (max-width: 820px)`, extend the existing terminal rule:

```css
.terminal-card { position: static; height: auto; min-height: 560px; }
```

- [ ] **Step 3: Run the focused test and verify GREEN**

Run:

```bash
npx playwright test tests/e2e/readability.spec.ts --grep "lab terminal stays centered"
```

Expected: PASS for both desktop geometry and mobile computed positioning.

- [ ] **Step 4: Run the Lab-related end-to-end tests**

Run:

```bash
npx playwright test tests/e2e/readability.spec.ts tests/e2e/learning-flows.spec.ts
```

Expected: all readability, course interaction, command fill, execution, and Tab completion scenarios PASS.

- [ ] **Step 5: Commit the tested behavior**

```bash
git add src/styles.css tests/e2e/readability.spec.ts
git commit -m "fix: keep lab terminal centered while scrolling"
```

### Task 3: Complete regression and production verification

**Files:**
- Verify only: entire repository

**Interfaces:**
- Consumes: the committed sticky terminal behavior.
- Produces: evidence that the change is safe to publish and works at the public domain.

- [ ] **Step 1: Run all local quality gates**

Run each command independently:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
git diff --check
```

Expected: every command exits with status `0`, and the worktree contains no uncommitted files.

- [ ] **Step 2: Push the tested master branch**

```bash
git push origin master
```

Expected: GitHub accepts the new commits and `master` matches `origin/master`.

- [ ] **Step 3: Verify the Vercel production deployment**

Confirm that Vercel reports the new commit as a `READY` production deployment. Open `https://linux.cxx.pub/lab` at `1440x900`, scroll down `500px`, and verify the terminal remains fully visible with its center within `36px` of the viewport center. Repeat at `390x844` and verify the terminal scrolls normally with the page and no horizontal overflow appears.
