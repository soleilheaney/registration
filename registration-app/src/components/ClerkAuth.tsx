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
