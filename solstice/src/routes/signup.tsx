import { createFileRoute } from '@tanstack/react-router'
import { SignUp } from '@clerk/clerk-react'
import * as React from 'react'

export const Route = createFileRoute('/signup')({
  component: SignUpPage,
})

function SignUpPage() {
  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <SignUp
        routing="path"
        path="/signup"
        signInUrl="/login"
        redirectUrl="/"
      />
    </div>
  )
}
