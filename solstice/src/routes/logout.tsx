import { createFileRoute, redirect } from '@tanstack/react-router'
import { useClerk } from '@clerk/clerk-react'
import * as React from 'react'

export const Route = createFileRoute('/logout')({
  component: LogoutComp,
})

function LogoutComp() {
  const { signOut } = useClerk()
  
  React.useEffect(() => {
    const performSignOut = async () => {
      await signOut()
      window.location.href = '/'
    }
    
    performSignOut()
  }, [signOut])
  
  return <div>Logging out...</div>
}
