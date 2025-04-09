import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from './prisma';

describe('Prisma Client Connection', () => {
  let userId: string;

  beforeAll(async () => {
    // Clean up test data before starting
    await prisma.user.deleteMany({
      where: {
        email: 'test@example.com',
      },
    });
  });

  it('should connect to the database', async () => {
    const result = await prisma.$queryRaw`SELECT 1 as result`;
    expect(result).toEqual([{ result: 1 }]);
  });

  it('should create a user', async () => {
    const user = await prisma.user.create({
      data: {
        clerkId: 'test-clerk-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'PLAYER',
      },
    });

    userId = user.id;
    
    expect(user).toHaveProperty('id');
    expect(user.email).toBe('test@example.com');
    expect(user.role).toBe('PLAYER');
  });

  it('should retrieve a user', async () => {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    expect(user).not.toBeNull();
    expect(user?.email).toBe('test@example.com');
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: {
        email: 'test@example.com',
      },
    });
    
    // Disconnect Prisma client
    await prisma.$disconnect();
  });
});