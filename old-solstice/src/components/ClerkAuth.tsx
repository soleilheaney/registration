import * as React from 'react';
import { SignIn, SignUp, UserButton, useUser } from '@clerk/clerk-react';
import { Link } from '@tanstack/react-router';

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
      // Sync user with our database via API
      const handleSync = async () => {
        try {
          console.log('Syncing user with database:', user.primaryEmailAddress?.emailAddress);
          
          // Call our API endpoint to sync the user
          const response = await fetch('/syncUser/api', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              clerkId: user.id,
              email: user.primaryEmailAddress?.emailAddress,
              firstName: user.firstName,
              lastName: user.lastName,
            }),
          });
          
          if (!response.ok) {
            throw new Error(`Failed to sync user: ${response.statusText}`);
          }
          
          const result = await response.json();
          console.log('User synced with database:', result);
          
          setSynced(true);
        } catch (error) {
          console.error('Error syncing user with database:', error);
        }
      };
      
      handleSync();
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
