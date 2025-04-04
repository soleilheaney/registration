import { createFileRoute } from '@tanstack/react-router'
import { ClerkSignIn } from '~/components/ClerkAuth'
import { useUser } from '@clerk/clerk-react'

export const Route = createFileRoute('/_authed')({
  beforeLoad: () => {
  },
  component: ({ children }) => {
    const { isSignedIn, isLoaded } = useUser();
    
    if (!isLoaded) {
      return <div>Loading...</div>;
    }
    
    if (!isSignedIn) {
      return <ClerkSignIn />;
    }
    
    return <>{children}</>;
  },
})
