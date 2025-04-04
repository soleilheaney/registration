import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuth } from '@clerk/clerk-react'
import * as React from 'react'

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/_protected': {
      parentRoute: typeof import('./__root').Route
    }
  }
}

export const Route = createFileRoute('/_protected')({
  beforeLoad: () => {
    const { isSignedIn, isLoaded } = useAuth()

    if (!isLoaded) {
      return
    }

    if (!isSignedIn) {
      throw redirect({
        to: '/login',
      })
    }
  },
  component: ({ children }) => {
    return <>{children}</>
  }
})
