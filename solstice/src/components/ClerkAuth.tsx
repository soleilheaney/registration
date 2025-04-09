import * as React from 'react';
import { SignIn, SignUp, UserButton, useUser } from '@clerk/clerk-react';
import { Link } from '@tanstack/react-router';
import { findOrCreateUser, setUserAsAdmin } from '../utils/user';

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
          
          // We'll instead print debug info that we can see in the console
          console.log('User created/found in database:', dbUser);
          
          // Check if it's the first user (first user becomes admin automatically)
          if (dbUser.role !== 'ADMIN') {
            try {
              console.log('Checking if this is the first user to make them admin:', dbUser.email);
              
              // Let's directly use our setUserAsAdmin utility function instead of an API call
              // This will be more reliable for now
              const updatedUser = await setUserAsAdmin(dbUser.clerkId);
              console.log('User set as admin:', updatedUser);
            } catch (error) {
              console.error('Error setting admin status:', error);
            }
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
