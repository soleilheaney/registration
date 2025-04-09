/// <reference types="vinxi/types/client" />
import { hydrateRoot } from 'react-dom/client'
import { StartClient } from '@tanstack/react-start'
import { createRouter } from './router'
import { ClerkProvider } from '@clerk/clerk-react'

const router = createRouter()
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

hydrateRoot(
  document,
  <ClerkProvider publishableKey={publishableKey}>
    <StartClient router={router} />
  </ClerkProvider>
)
