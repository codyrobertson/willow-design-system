'use client'

import React from 'react'
import Link from 'next/link'
import { Logo } from '../ui/Logo'
import { FA6Icon } from '../ui/FA6Icon'

interface NavigationProps {
  showBackButton?: boolean
  transparent?: boolean
}

export function Navigation({ showBackButton = false, transparent = false }: NavigationProps) {
  return (
    <nav className={`w-full px-6 py-4 ${transparent ? 'absolute top-0 left-0 z-50' : 'bg-white border-b border-neutral-100'}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showBackButton && (
            <Link href="/" className="p-2 rounded-full hover:bg-neutral-100 transition-colors">
              <FA6Icon name="arrow-left" size="lg" />
            </Link>
          )}
          <Logo size="md" lockup="logomark" variant={transparent ? 'light' : 'dark'} />
        </div>
        
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-neutral-100 transition-colors">
            <FA6Icon name="user-circle" size="lg" />
          </button>
        </div>
      </div>
    </nav>
  )
}