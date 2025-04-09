import * as React from 'react';
import { SignIn, SignUp, UserButton, useUser } from '@clerk/clerk-react';
import { Link } from '@tanstack/react-router';
import { findOrCreateUser } from '../utils/user';

export function ClerkSignIn() {
  return (
    <div className="fixed inset-0 bg-white dark:bg-black flex items-start justify-center p-8">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Sign In</h1>
        <SignIn routing="path" path="/sign-in" />
      </div>
    </div>
  );
}

export function ClerkSignUp() {
  return (
    <div className="fixed inset-0 bg-white dark:bg-black flex items-start justify-center p-8">
      <div className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Sign Up</h1>
        <SignUp routing="path" path="/sign-up" />
      </div>
    </div>
  );
}

// This component syncs Clerk user with our database
export function ClerkUserSync() {
  const { isSignedIn, user, isLoaded } = useUser();
  const [synced, setSynced] = React.useState(false);
  
  React.useEffect(() => {
    if (isLoaded && isSignedIn && user && !synced) {
      // Sync user with our database
      const syncUser = async () => {
        try {
          // Find or create the user in our database
          const dbUser = await findOrCreateUser(user);
          
          // Check if this is the first user in the system and make them an admin
          // This is a common pattern for bootstrapping the first admin user
          const allUsers = await fetch('/users/api').then(res => res.json());
          
          if (allUsers.length === 1 && allUsers[0].id === dbUser.id && dbUser.role !== 'ADMIN') {
            console.log('Setting first user as admin:', dbUser.email);
            
            // Set as admin using a server API call
            await fetch('/api/setadmin', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                clerkId: dbUser.clerkId 
              }),
            });
          }
          
          setSynced(true);
        } catch (error) {
          console.error('Error syncing user with database:', error);
        }
      };
      
      syncUser();
    }
  }, [isLoaded, isSignedIn, user, synced]);
  
  // This is just a utility component that doesn't render anything
  return null;
}

export function ClerkUserProfile() {
  const { isSignedIn, user } = useUser();
  
  return (
    <div className="ml-auto">
      {isSignedIn ? (
        <>
          <span className="mr-2">{user?.primaryEmailAddress?.emailAddress}</span>
          <UserButton />
        </>
      ) : (
        <Link to="/login">Login</Link>
      )}
    </div>
  );
}
