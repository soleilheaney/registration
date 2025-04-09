import { createFileRoute } from '@tanstack/react-router';
import { setUserAsAdmin } from '~/utils/user';
import { z } from 'zod';

// Schema for the request body
const SetAdminSchema = z.object({
  clerkId: z.string(),
});

export const Route = createFileRoute('/_authed/setadmin/api')({
  validateSearch: z.object({}).optional(),
  action: async ({ request }) => {
    try {
      // Only allow POST requests
      if (request.method !== 'POST') {
        throw new Response('Method Not Allowed', { status: 405 });
      }
      
      // Parse the request body
      const data = await request.json();
      
      // Validate the request body
      const parsedBody = SetAdminSchema.safeParse(data);
      if (!parsedBody.success) {
        throw new Response(JSON.stringify({ error: 'Invalid request body' }), { 
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      
      // Set the user as admin
      const user = await setUserAsAdmin(parsedBody.data.clerkId);
      
      // Return success
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        }
      };
    } catch (error) {
      console.error('Error setting admin:', error);
      throw new Response(JSON.stringify({ error: 'Failed to set admin' }), { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  },
});