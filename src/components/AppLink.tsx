import type { AnchorHTMLAttributes, MouseEvent } from 'react'

type AppLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  to: string
}

type NavLinkProps = Omit<AppLinkProps, 'className'> & {
  className?: string | ((state: { isActive: boolean }) => string)
}

function isPlainLeftClick(event: MouseEvent<HTMLAnchorElement>) {
  return (
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey
  )
}

export function AppLink({
  to,
  download,
  onClick,
  target,
  ...props
}: AppLinkProps) {
  return (
    <a
      {...props}
      download={download}
      href={to}
      target={target}
      onClick={(event) => {
        onClick?.(event)

        if (
          event.defaultPrevented ||
          !isPlainLeftClick(event) ||
          download !== undefined ||
          (target !== undefined && target !== '_self') ||
          !to.startsWith('/')
        ) {
          return
        }

        event.preventDefault()
        window.history.pushState(null, '', to)
        window.dispatchEvent(new PopStateEvent('popstate'))
        window.scrollTo({ top: 0, behavior: 'instant' })
      }}
    />
  )
}

export function NavLink({ className, to, ...props }: NavLinkProps) {
  const isActive = window.location.pathname === to
  const resolvedClassName =
    typeof className === 'function' ? className({ isActive }) : className

  return (
    <AppLink
      {...props}
      aria-current={isActive ? 'page' : undefined}
      className={resolvedClassName}
      to={to}
    />
  )
}
