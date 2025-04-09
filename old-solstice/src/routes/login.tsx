import { createFileRoute } from '@tanstack/react-router'
import { SignIn } from '@clerk/clerk-react'
import * as React from 'react'

export const Route = createFileRoute('/login')({
  component: LoginComp,
})

function LoginComp() {
  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <SignIn
        routing="path"
        path="/login"
        signUpUrl="/signup"
        redirectUrl="/"
      />
    </div>
  )
}
