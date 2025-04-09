import * as React from 'react';
import { Link } from '@tanstack/react-router';

export function ClientSideAuth() {
  const [isClient, setIsClient] = React.useState(false);
  
  React.useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) {
    return (
      <div className="ml-auto">
        <Link to="/login">Login</Link>
      </div>
    );
  }
  
  const ClientAuthContent = React.lazy(() => 
    import('./ClerkAuth').then(module => ({
      default: () => {
        const { ClerkUserProfile } = module;
        return <ClerkUserProfile />;
      }
    }))
  );
  
  const UserSyncComponent = React.lazy(() => 
    import('./ClerkAuth').then(module => ({
      default: () => {
        const { ClerkUserSync } = module;
        return <ClerkUserSync />;
      }
    }))
  );
  
  return (
    <>
      <React.Suspense fallback={<div>Loading...</div>}>
        <ClientAuthContent />
      </React.Suspense>
      
      {/* This component syncs Clerk user with our database but doesn't render anything */}
      <React.Suspense fallback={null}>
        <UserSyncComponent />
      </React.Suspense>
    </>
  );
}
