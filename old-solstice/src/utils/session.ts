// src/services/session.server.ts
import { useSession } from '@tanstack/react-start/server'
import type { User } from '@prisma/client'
import { prisma } from './prisma'
import { clerkClient } from '@clerk/clerk-sdk-node'

type SessionUser = {
  userEmail: User['email']
}

export function useAppSession() {
  return useSession<SessionUser>({
    password: 'ChangeThisBeforeShippingToProdOrYouWillBeFired',
  })
}

/**
 * Gets or creates a user in the database based on their Clerk ID
 */
export async function getCurrentUser(clerkId: string) {
  let user = await prisma.user.findUnique({
    where: {
      clerkId: clerkId
    }
  })

  if (!user) {
    try {
      const clerkUser = await clerkClient.users.getUser(clerkId)
      user = await prisma.user.create({
        data: {
          clerkId: clerkId,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          firstName: clerkUser.firstName || '',
          lastName: clerkUser.lastName || ''
        }
      })
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  }

  return user
}
