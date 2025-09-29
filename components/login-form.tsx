"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useSessionContext } from "@/components/session-provider"

export function LoginForm() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [name, setName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [address, setAddress] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { refreshSession } = useSessionContext()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (isSignUp && password !== confirmPassword) {
      alert("Passwords do not match!")
      setIsLoading(false)
      return
    }

    try {
      if (isSignUp) {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, phoneNumber, address })
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: 'Sign up failed' }))
          alert(data.error || 'Sign up failed')
          return
        }
        alert('Account created successfully!')
        
        // Refresh the session to update the context
        await refreshSession()
        
        // Reload the page to ensure all components get the updated session
        window.location.href = '/home'
      } else {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: 'Login failed' }))
          alert(data.error || 'Login failed')
          return
        }
        const data = await res.json()
        
        // Refresh the session to update the context
        await refreshSession()
        
        // Reload the page to ensure all components get the updated session
        window.location.href = data?.user?.role === 'admin' ? '/admin' : '/home'
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Image 
            src="/logo.png" 
            alt="EggMart Logo" 
            width={120} 
            height={40} 
            className="h-8 w-auto sm:h-10 md:h-12"
          />
        </div>
        <CardTitle className="text-2xl font-bold text-gray-900">
          {isSignUp ? "Join EggMart" : "Welcome to EggMart"}
        </CardTitle>
        <CardDescription>{isSignUp ? "Create your account" : "Sign in to your account"}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                type="text"
                placeholder="Enter your complete address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          <Button type="submit" className="w-full bg-pink-500 hover:bg-pink-600" disabled={isLoading}>
            {isLoading ? (isSignUp ? "Creating Account..." : "Signing in...") : isSignUp ? "Create Account" : "Sign In"}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-pink-600 hover:text-pink-700 text-sm"
          >
            {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
          </button>
        </div>

        <div className="mt-2 text-center">
          <Link href="/signup" className="text-pink-600 hover:text-pink-700 text-sm">
            Go to dedicated Sign Up page
          </Link>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-pink-600 hover:text-pink-700 text-sm">
            Back to Store
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

