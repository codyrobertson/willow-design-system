'use client'

import React from 'react'
import { Navigation } from './Navigation'

interface AppLayoutProps {
  children: React.ReactNode
  showNavigation?: boolean
  transparentNav?: boolean
  showBackButton?: boolean
}

export function AppLayout({ 
  children, 
  showNavigation = true,
  transparentNav = false,
  showBackButton = false
}: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-50">
      {showNavigation && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <Navigation 
            transparent={transparentNav}
            showBackButton={showBackButton}
          />
        </div>
      )}
      <div className={showNavigation ? "pt-16" : ""}>
        {children}
      </div>
    </div>
  )
}