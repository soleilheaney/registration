import { createFileRoute } from '@tanstack/react-router'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header with primary background */}
      <header className="bg-primary text-primary-foreground py-4">
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
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-primary mb-4">Welcome to Sports Registration</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
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
          <h2 className="text-3xl font-bold text-center text-primary mb-12">Why Register With Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Easy Registration</CardTitle>
                <CardDescription>Register for events quickly and easily</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Simple and quick registration process for all events.</p>
              </CardContent>
              <CardFooter>
                <Button variant="secondary" size="sm">Learn More</Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Nationwide Events</CardTitle>
                <CardDescription>Events across the country</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Access to sports events across all of Canada.</p>
              </CardContent>
              <CardFooter>
                <Button variant="secondary" size="sm">View Events</Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Community Support</CardTitle>
                <CardDescription>Join our thriving community</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Join a thriving community of sports enthusiasts.</p>
              </CardContent>
              <CardFooter>
                <Button variant="secondary" size="sm">Join Now</Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-8">
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