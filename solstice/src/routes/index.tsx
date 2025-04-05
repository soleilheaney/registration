import { createFileRoute } from '@tanstack/react-router'
import { Button } from '../components/ui/button'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header with red background */}
      <header className="bg-red-800 text-white py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Sports Registration</h1>
          <nav className="space-x-4">
            <a href="#" className="hover:underline">Events</a>
            <a href="#" className="hover:underline">About</a>
            <a href="#" className="hover:underline">Contact</a>
          </nav>
        </div>
      </header>

      {/* Hero section */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-red-800 mb-4">Welcome to Sports Registration</h2>
          <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
            Register for upcoming sports events and tournaments across Canada. Join the community and participate in exciting competitions!
          </p>
          <div className="space-x-4">
            <Button>Register Now</Button>
            <Button variant="outline">Browse Events</Button>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-red-800 mb-12">Why Register With Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-red-800 mb-3">Easy Registration</h3>
              <p className="text-gray-600">Simple and quick registration process for all events.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-red-800 mb-3">Nationwide Events</h3>
              <p className="text-gray-600">Access to sports events across all of Canada.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-red-800 mb-3">Community Support</h3>
              <p className="text-gray-600">Join a thriving community of sports enthusiasts.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-red-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h2 className="text-xl font-bold">Sports Registration</h2>
              <p className="text-sm mt-2">© 2025 All Rights Reserved</p>
            </div>
            <div className="flex space-x-4">
              <a href="#" className="hover:underline">Privacy Policy</a>
              <a href="#" className="hover:underline">Terms of Service</a>
              <a href="#" className="hover:underline">Contact Us</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
