import { createFileRoute } from '@tanstack/react-router';
import { findOrCreateUser, setUserAsAdmin, listUsers } from '~/utils/user';

// Create an API route
export const Route = createFileRoute('/syncUser/api')({
  // Define the action for POST requests
  action: async ({ request }) => {
    try {
      // Only allow POST requests
      if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
      }
      
      // Parse the request body
      const data = await request.json();
      const { clerkId, email, firstName, lastName } = data;
      
      // Basic validation
      if (!clerkId || !email) {
        return Response.json({ error: 'clerkId and email are required' }, { status: 400 });
      }
      
      // Find or create the user in our database
      const user = await findOrCreateUser({
        id: clerkId,
        emailAddresses: [{ emailAddress: email }],
        firstName: firstName || null,
        lastName: lastName || null,
      });
      
      // Check if this is the first user in the system
      const allUsers = await listUsers();
      
      // Set the first user as admin if not already
      let isAdmin = user.role === 'ADMIN';
      if (!isAdmin && allUsers.length === 1) {
        // This is the first user, make them an admin
        const updatedUser = await setUserAsAdmin(user.clerkId);
        isAdmin = updatedUser.role === 'ADMIN';
      }
      
      // Return the synchronized user
      return Response.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isAdmin,
        }
      });
    } catch (error) {
      console.error('Error syncing user:', error);
      return Response.json({ error: 'Failed to sync user' }, { status: 500 });
    }
  }
});