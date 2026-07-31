import { expect, test } from '@playwright/test'

test('Ubuntu teaching installation exposes state, validation and completion', async ({ page }) => {
  await page.goto('/install')
  await expect(page.getByRole('heading', { name: '这台设备可以运行吗？' })).toBeVisible()
  await expect(page.getByRole('button', { name: /环境检测/ })).toHaveAttribute('aria-current', 'step')
  await expect(page.locator('.installer-content .notice').last().locator('svg')).toHaveCount(1)

  await page.getByRole('button', { name: /继续/ }).click()
  await expect(page.getByRole('heading', { name: '你将安装什么？' })).toBeVisible()
  await expect(page.getByText(/来宾/)).toHaveCount(0)

  await page.getByRole('button', { name: /继续/ }).click()
  const buildroot = page.getByRole('button', { name: /Buildroot Core/ })
  const ubuntu = page.getByRole('button', { name: /Ubuntu 24.04 LTS/ })
  await expect(buildroot).toHaveAttribute('aria-pressed', 'true')
  await expect(ubuntu).toHaveAttribute('aria-pressed', 'false')
  await ubuntu.click()
  await expect(ubuntu).toHaveAttribute('aria-pressed', 'true')

  await page.getByRole('button', { name: /继续/ }).click()
  await expect(page.getByRole('button', { name: '自动分区（推荐）' })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: /继续/ }).click()

  const staticIpv4 = page.getByRole('button', { name: '静态 IPv4' })
  await expect(page.getByRole('button', { name: /DHCP 自动获取/ })).toHaveAttribute('aria-pressed', 'true')
  await staticIpv4.click()
  await expect(staticIpv4).toHaveAttribute('aria-pressed', 'true')

  const dns = page.getByLabel('DNS 服务器（逗号分隔）')
  await dns.fill('999.1.1.1')
  await expect(dns).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByRole('button', { name: /继续/ })).toBeDisabled()
  await dns.fill('1.1.1.1, 8.8.8.8')
  await expect(dns).toHaveAttribute('aria-invalid', 'false')
  await page.getByRole('button', { name: /继续/ }).click()

  const username = page.getByLabel('用户名')
  await username.fill('Invalid User')
  await expect(page.getByRole('button', { name: /继续/ })).toBeDisabled()
  await username.fill('student')
  await page.getByRole('button', { name: /继续/ }).click()
  await expect(page.getByRole('heading', { name: '准备首次启动' })).toBeVisible()
  await page.getByRole('button', { name: '写入配置', exact: true }).click()
  await expect(page.getByRole('heading', { name: '模拟系统安装完成' })).toBeVisible()

  await page.getByRole('link', { name: /进入命令行实验室/ }).click()
  await expect(page.getByText('Ubuntu 24.04 LTS 教学模拟终端')).toBeVisible()
  await page.getByRole('button', { name: /Shell、路径、帮助与 Tab 补全/ }).click()
  await page.getByRole('button', { name: '填入终端 pwd' }).click()
  await expect(page.getByRole('status')).toContainText('命令已填入')
  await page.keyboard.press('Enter')
  await expect(page.locator('.xterm-rows')).toContainText('/home/student')

  await page.keyboard.type('una')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Enter')
  await expect(page.locator('.xterm-rows')).toContainText('Linux')
})

test('Debian teaching installation reaches its matching terminal', async ({ page }) => {
  await page.goto('/install')
  await page.getByRole('button', { name: /继续/ }).click()
  await page.getByRole('button', { name: /继续/ }).click()
  await page.getByRole('button', { name: /Debian 12/ }).click()
  await page.getByRole('button', { name: /继续/ }).click()
  await page.getByRole('button', { name: /继续/ }).click()
  await page.getByRole('button', { name: /继续/ }).click()
  await page.getByRole('button', { name: /继续/ }).click()
  await page.getByRole('button', { name: '写入配置', exact: true }).click()
  await expect(page.getByRole('heading', { name: '模拟系统安装完成' })).toBeVisible()
  await page.getByRole('link', { name: /进入命令行实验室/ }).click()
  await expect(page.getByText('Debian 12 Bookworm 教学模拟终端')).toBeVisible()
})

test('command library search, expansion and reset remain usable', async ({ page }) => {
  await page.goto('/commands')
  const search = page.getByPlaceholder('搜索名称、用途或语法…')

  await search.fill('apt')
  await expect(page.locator('.command-toolbar__result')).not.toHaveText('显示 0 条')
  const aptCard = page.locator('.command-card').filter({ hasText: 'apt' }).first()
  await expect(aptCard).toBeVisible()
  await aptCard.locator('.command-card__summary').click()
  await expect(aptCard.locator('.command-card__details')).toBeVisible()

  await search.fill('definitely-no-such-command')
  await expect(page.getByRole('heading', { name: '没有匹配的命令' })).toBeVisible()
  await page.getByRole('button', { name: '清除' }).click()
  await expect(page.getByRole('heading', { name: '没有匹配的命令' })).toHaveCount(0)
})

test('course deep links and saved task progress survive reload', async ({ page }) => {
  await page.goto('/courses?lesson=shell-foundations')
  await expect(page.getByRole('heading', { name: 'Shell、路径、帮助与 Tab 补全' })).toBeVisible()
  await expect(page.locator('.course-index__item.is-active')).toHaveAttribute('aria-current', 'step')

  const firstTask = page.locator('.lab-step__check').first()
  await firstTask.click()
  await expect(firstTask).toHaveAttribute('aria-pressed', 'true')
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Shell、路径、帮助与 Tab 补全' })).toBeVisible()
  await expect(page.locator('.lab-step__check').first()).toHaveAttribute('aria-pressed', 'true')
})

test('about page explains Linux learning instead of guest-system jargon', async ({ page }) => {
  await page.goto('/about')
  await expect(page.getByRole('heading', { name: 'Linux 学习地图' })).toBeVisible()
  await expect(page.getByText(/发行版/).first()).toBeVisible()
  await expect(page.getByText(/企业/).first()).toBeVisible()
  await expect(page.getByText(/嵌入式/).first()).toBeVisible()
  await expect(page.getByText(/来宾/)).toHaveCount(0)
})
