import { createFileRoute } from '@tanstack/react-router';
import { listUsers } from '~/utils/user';
import { z } from 'zod';

export const Route = createFileRoute('/_authed/users/api')({
  validateSearch: z.object({}).optional(),
  loader: async ({ context }) => {
    try {
      // List all users from our database
      const users = await listUsers();
      
      // Return sanitized user data (exclude sensitive fields)
      return users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt,
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new Response(JSON.stringify({ error: 'Failed to fetch users' }), { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  },
});