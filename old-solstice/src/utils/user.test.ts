import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from './prisma';
import {
  createUser,
  findUserByClerkId,
  findUserByEmail,
  findOrCreateUser,
  isAdmin,
  setUserAsAdmin,
  listUsers,
} from './user';

describe('User Utilities', () => {
  const testClerkId = 'test-clerk-id-123';
  const testEmail = 'test-user@example.com';

  // Clean up before tests
  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: testEmail,
      },
    });
  });

  // Clean up after each test to ensure isolation
  beforeEach(async () => {
    await prisma.user.deleteMany({
      where: {
        email: testEmail,
      },
    });
  });

  it('should create a user', async () => {
    const user = await createUser({
      clerkId: testClerkId,
      email: testEmail,
      firstName: 'Test',
      lastName: 'User',
    });

    expect(user).toHaveProperty('id');
    expect(user.clerkId).toBe(testClerkId);
    expect(user.email).toBe(testEmail);
    expect(user.role).toBe('PLAYER'); // Default role
  });

  it('should find a user by clerk id', async () => {
    // Create a user first
    await createUser({
      clerkId: testClerkId,
      email: testEmail,
    });

    const foundUser = await findUserByClerkId(testClerkId);
    expect(foundUser).not.toBeNull();
    expect(foundUser?.clerkId).toBe(testClerkId);
  });

  it('should find a user by email', async () => {
    // Create a user first
    await createUser({
      clerkId: testClerkId,
      email: testEmail,
    });

    const foundUser = await findUserByEmail(testEmail);
    expect(foundUser).not.toBeNull();
    expect(foundUser?.email).toBe(testEmail);
  });

  it('should find or create a user', async () => {
    const mockClerkUser = {
      id: testClerkId,
      emailAddresses: [{ emailAddress: testEmail }],
      firstName: 'Test',
      lastName: 'User',
    };

    // First call should create the user
    const createdUser = await findOrCreateUser(mockClerkUser);
    expect(createdUser.clerkId).toBe(testClerkId);
    expect(createdUser.email).toBe(testEmail);

    // Second call should find the existing user
    const foundUser = await findOrCreateUser(mockClerkUser);
    expect(foundUser.id).toBe(createdUser.id); // Same user
  });

  it('should check if a user is an admin', async () => {
    // Create a regular user
    await createUser({
      clerkId: testClerkId,
      email: testEmail,
    });

    // Check if admin (should be false)
    let isUserAdmin = await isAdmin(testClerkId);
    expect(isUserAdmin).toBe(false);

    // Set as admin
    await setUserAsAdmin(testClerkId);

    // Check again (should be true)
    isUserAdmin = await isAdmin(testClerkId);
    expect(isUserAdmin).toBe(true);
  });

  it('should list all users', async () => {
    // Create a test user
    await createUser({
      clerkId: testClerkId,
      email: testEmail,
    });

    // List users
    const users = await listUsers();
    expect(users.length).toBeGreaterThan(0);
    
    // Find our test user in the list
    const testUser = users.find(user => user.clerkId === testClerkId);
    expect(testUser).toBeDefined();
  });

  // Clean up after all tests
  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: testEmail,
      },
    });
    
    await prisma.$disconnect();
  });
});