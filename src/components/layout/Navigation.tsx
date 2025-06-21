'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Logo, LogoProps } from '../ui/Logo'
import { ArrowLeft, UserCircle, Package } from 'lucide-react'

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

  const defaultLockup = transparent ? 'full' : 'logomark'
  const defaultVariant = transparent ? 'dark' : 'dark'

  return (
    <nav
      className={`w-full px-6 py-4 ${
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
          <Logo
            size={logoSize ?? 'md'}
            lockup={logoLockup ?? defaultLockup}
            variant={logoVariant ?? defaultVariant}
          />
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/registry"
            className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium ${
              transparent
                ? 'text-white hover:bg-white/10'
                : 'hover:bg-neutral-100'
            }`}
          >
            <Package className="w-4 h-4" />
            Registry
          </Link>
          <button
            className={`p-2 rounded-full transition-colors ${
              transparent
                ? 'text-white hover:bg-white/10'
                : 'hover:bg-neutral-100'
            }`}
          >
            <UserCircle className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  )
}