"use client"

import { useState } from "react"
import { Smartphone, Banknote, MapPin, Clock, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface PaymentMethodsProps {
  selectedMethod: string
  onMethodChange: (method: string) => void
  total: number
}

export function PaymentMethods({ selectedMethod, onMethodChange, total }: PaymentMethodsProps) {
  const [gcashNumber, setGcashNumber] = useState("")
  const [showGcashModal, setShowGcashModal] = useState(false)
  const [gcashPaymentStatus, setGcashPaymentStatus] = useState<"pending" | "success" | "failed" | null>(null)

  const handleGcashPayment = () => {
    setShowGcashModal(true)
    setGcashPaymentStatus("pending")

    // Simulate payment processing
    setTimeout(() => {
      setGcashPaymentStatus("success")
    }, 3000)
  }

  return (
    <div className="space-y-4">
      <RadioGroup value={selectedMethod} onValueChange={onMethodChange}>
        {/* Cash on Delivery */}
        <Card
          className={`cursor-pointer transition-colors ${selectedMethod === "cod" ? "ring-2 ring-pink-500 bg-pink-50" : ""}`}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="cod" id="cod" />
              <Label htmlFor="cod" className="flex-1 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Banknote className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Cash on Delivery</h3>
                      <p className="text-sm text-gray-600">Pay when you receive your order</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Most Popular
                  </Badge>
                </div>
              </Label>
            </div>
            {selectedMethod === "cod" && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="space-y-2">
                    <h4 className="font-semibold text-green-800">Cash on Delivery Instructions</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Prepare exact amount: ₱{total}</li>
                      <li>• Payment accepted upon delivery</li>
                      <li>• Delivery rider will provide receipt</li>
                      <li>• Inspect items before payment</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* GCash */}
        <Card
          className={`cursor-pointer transition-colors ${selectedMethod === "gcash" ? "ring-2 ring-pink-500 bg-pink-50" : ""}`}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="gcash" id="gcash" />
              <Label htmlFor="gcash" className="flex-1 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">GCash</h3>
                      <p className="text-sm text-gray-600">Pay via GCash mobile wallet</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Instant
                  </Badge>
                </div>
              </Label>
            </div>
            {selectedMethod === "gcash" && (
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <Smartphone className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="space-y-2">
                      <h4 className="font-semibold text-blue-800">GCash Payment</h4>
                      <p className="text-sm text-blue-700">Secure and instant payment via GCash mobile wallet</p>
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="gcash-number">GCash Mobile Number</Label>
                  <Input
                    id="gcash-number"
                    value={gcashNumber}
                    onChange={(e) => setGcashNumber(e.target.value)}
                    placeholder="09XX XXX XXXX"
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={handleGcashPayment}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={!gcashNumber}
                >
                  Pay ₱{total} via GCash
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Store Pickup Payment */}
        <Card
          className={`cursor-pointer transition-colors ${selectedMethod === "pickup-pay" ? "ring-2 ring-pink-500 bg-pink-50" : ""}`}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="pickup-pay" id="pickup-pay" />
              <Label htmlFor="pickup-pay" className="flex-1 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Pay at Store</h3>
                      <p className="text-sm text-gray-600">Pay when you pick up your order</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    No Delivery Fee
                  </Badge>
                </div>
              </Label>
            </div>
            {selectedMethod === "pickup-pay" && (
              <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div className="space-y-2">
                    <h4 className="font-semibold text-purple-800">Store Pickup Information</h4>
                    <div className="text-sm text-purple-700 space-y-1">
                      <p>
                        <strong>Address:</strong> 123 Farm Road, Quezon City
                      </p>
                      <p>
                        <strong>Hours:</strong> Mon-Sat 8:00 AM - 6:00 PM
                      </p>
                      <p>
                        <strong>Contact:</strong> (02) 8123-4567
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="w-4 h-4" />
                        <span>Order will be ready in 2-4 hours</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </RadioGroup>

      {/* GCash Payment Modal */}
      <Dialog open={showGcashModal} onOpenChange={setShowGcashModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-blue-600" />
              GCash Payment
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {gcashPaymentStatus === "pending" && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Processing Payment</h3>
                  <p className="text-sm text-gray-600">Please wait while we process your GCash payment...</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Amount:</strong> ₱{total}
                    <br />
                    <strong>To:</strong> EggMart Store
                    <br />
                    <strong>Reference:</strong> ORD-{Date.now().toString().slice(-6)}
                  </p>
                </div>
              </div>
            )}

            {gcashPaymentStatus === "success" && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-800">Payment Successful!</h3>
                  <p className="text-sm text-gray-600">Your GCash payment has been processed successfully.</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-left">
                  <p className="text-sm text-green-700">
                    <strong>Transaction ID:</strong> GC{Date.now().toString().slice(-8)}
                    <br />
                    <strong>Amount Paid:</strong> ₱{total}
                    <br />
                    <strong>Status:</strong> Confirmed
                  </p>
                </div>
                <Button
                  onClick={() => setShowGcashModal(false)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  Continue to Order Confirmation
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
