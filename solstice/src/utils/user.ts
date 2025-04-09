import { prisma } from './prisma';
import type { User } from '@prisma/client';

export interface UserCreateInput {
  clerkId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role?: 'ADMIN' | 'PLAYER';
}

/**
 * Create a new user in the database from Clerk user data
 */
export async function createUser(userData: UserCreateInput): Promise<User> {
  return prisma.user.create({
    data: userData,
  });
}

/**
 * Find a user by their Clerk ID
 */
export async function findUserByClerkId(clerkId: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { clerkId },
  });
}

/**
 * Find a user by their email
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { email },
  });
}

/**
 * Find or create a user from Clerk user data
 */
export async function findOrCreateUser(clerkUser: any): Promise<User> {
  if (!clerkUser) {
    throw new Error('User data is required');
  }

  const { id: clerkId, emailAddresses, firstName, lastName } = clerkUser;
  
  if (!emailAddresses?.[0]?.emailAddress) {
    throw new Error('Email is required');
  }

  const email = emailAddresses[0].emailAddress;

  // Check if user already exists
  const existingUser = await findUserByClerkId(clerkId);
  if (existingUser) {
    return existingUser;
  }

  // Create new user
  return createUser({
    clerkId,
    email,
    firstName: firstName || null,
    lastName: lastName || null,
  });
}

/**
 * Check if a user is an admin
 */
export async function isAdmin(clerkId: string): Promise<boolean> {
  const user = await findUserByClerkId(clerkId);
  return user?.role === 'ADMIN';
}

/**
 * Set a user as admin
 */
export async function setUserAsAdmin(clerkId: string): Promise<User> {
  return prisma.user.update({
    where: { clerkId },
    data: { role: 'ADMIN' },
  });
}

/**
 * Lists all users
 */
export async function listUsers(): Promise<User[]> {
  return prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  });
}