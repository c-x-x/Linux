import { lazy, Suspense, useEffect, useState } from 'react'
import { AppShell } from './components/AppShell'

const HomePage = lazy(() => import('./pages/HomePage'))
const InstallPage = lazy(() => import('./pages/InstallPage'))
const LabPage = lazy(() => import('./pages/LabPage'))
const CommandsPage = lazy(() => import('./pages/CommandsPage'))
const CoursesPage = lazy(() => import('./pages/CoursesPage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))

function RouteLoader() {
  return (
    <div className="route-loader" role="status" aria-live="polite">
      <span className="route-loader__pulse" />
      正在加载学习环境
    </div>
  )
}

export default function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname)

  useEffect(() => {
    const handleNavigation = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', handleNavigation)
    return () => window.removeEventListener('popstate', handleNavigation)
  }, [])

  const Page =
    {
      '/': HomePage,
      '/install': InstallPage,
      '/lab': LabPage,
      '/commands': CommandsPage,
      '/courses': CoursesPage,
      '/about': AboutPage,
    }[pathname] ?? HomePage

  return (
    <AppShell>
      <Suspense fallback={<RouteLoader />}>
        <Page />
      </Suspense>
    </AppShell>
  )
}
