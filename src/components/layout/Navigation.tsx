'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Logo, LogoProps } from '../ui/Logo'
import { ArrowLeft, UserCircle, Package, Zap, Book } from 'lucide-react'

interface NavigationProps {
  showBackButton?: boolean
  transparent?: boolean
  logoLockup?: LogoProps['lockup']
  logoVariant?: LogoProps['variant']
  logoSize?: LogoProps['size']
}

export function Navigation({
  showBackButton = false,
  transparent = false,
  logoLockup,
  logoVariant,
  logoSize,
}: NavigationProps) {
  const router = useRouter()
  const pathname = usePathname()

  const defaultLockup = transparent ? 'full' : 'full'
  const defaultVariant = transparent ? 'light' : 'light'

  const isActive = (path: string) => {
    if (path === '/storybook' && (pathname === '/storybook' || pathname === '/')) return true
    return pathname === path
  }

  const getLinkClassName = (path: string) => `
    px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium
    ${isActive(path) 
      ? transparent 
        ? 'bg-white/20 text-white' 
        : 'bg-neutral-100 text-neutral-900'
      : transparent
        ? 'text-white hover:bg-white/10'
        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
    }
  `.trim().replace(/\s+/g, ' ')

  return (
    <nav
      className={`w-full px-4 sm:px-6 py-3 sm:py-4 ${
        transparent
          ? 'absolute top-0 left-0 z-50'
          : 'bg-white border-b border-neutral-100'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showBackButton && (
            <button
              onClick={() => router.back()}
              className={`p-2 rounded-full transition-colors ${
                transparent
                  ? 'text-white hover:bg-white/10'
                  : 'hover:bg-neutral-100'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <a href="https://willow-design-system.vercel.app/storybook" target="_blank" rel="noopener noreferrer">
            <Logo
              size={logoSize ?? 'md'}
              lockup={logoLockup ?? defaultLockup}
              variant={logoVariant ?? defaultVariant}
            />
          </a>
        </div>

        <div className="flex items-center gap-1">
          <Link
            href="/quick-start"
            className={getLinkClassName('/quick-start')}
          >
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">Quick Start</span>
          </Link>
          <a
            href="https://willow-design-system.vercel.app/storybook"
            target="_blank"
            rel="noopener noreferrer"
            className={getLinkClassName('/storybook')}
          >
            <Book className="w-4 h-4" />
            <span className="hidden sm:inline">Storybook</span>
          </a>
          <Link
            href="/registry"
            className={getLinkClassName('/registry')}
          >
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">Registry</span>
          </Link>
          <button
            className={`p-2 rounded-full transition-colors ml-2 ${
              transparent
                ? 'text-white hover:bg-white/10'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <UserCircle className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  )
}