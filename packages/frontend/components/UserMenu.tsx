'use client'

import { useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { User, Settings } from 'lucide-react'
import { useAuth } from '../lib/auth/AuthContext'

function DefaultAvatarIcon() {
  return <User className="h-5 w-5 text-muted" strokeWidth={1.75} aria-hidden />
}

export function UserMenu() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [avatarFailed, setAvatarFailed] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  // Reset broken-image state when the URL changes (e.g. re-login)
  useEffect(() => {
    setAvatarFailed(false)
  }, [user?.avatarUrl])

  useEffect(() => {
    if (!open) return

    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (!user) return null

  const showImage = Boolean(user.avatarUrl) && !avatarFailed

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-hairline bg-soft-stone text-ink transition hover:border-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-deep-green"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label="Account menu"
      >
        {showImage ? (
          <img
            src={user.avatarUrl!}
            alt=""
            className="h-full w-full object-cover"
            onError={() => setAvatarFailed(true)}
          />
        ) : (
          <DefaultAvatarIcon />
        )}
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-md border border-hairline bg-canvas py-1 shadow-lg"
        >
          <div className="border-b border-hairline px-4 py-3">
            <p className="truncate text-sm font-medium text-ink">{user.name}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
          {user.username ? (
            <Link
              href={`/users/${user.username}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-soft-stone"
            >
              <User className="h-4 w-4" strokeWidth={1.5} />
              Profile
            </Link>
          ) : null}
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-soft-stone"
          >
            <Settings className="h-4 w-4" strokeWidth={1.5} />
            Settings
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              void logout()
            }}
            className="block w-full px-4 py-2.5 text-left text-sm font-medium text-error transition hover:bg-error/5"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
