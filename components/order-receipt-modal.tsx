"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Package, MapPin, Phone, Mail, CreditCard, Truck, Calendar, User, Download } from "lucide-react"
import Image from "next/image"

interface OrderReceiptModalProps {
  isOpen: boolean
  onClose: () => void
  orderId: number | null
}

interface OrderDetails {
  id: number
  orderNumber: string
  status: string
  customerName: string
  customerEmail: string
  customerPhone: string
  customerAddress: string
  deliveryMethod: string
  paymentMethod: string
  subtotal: number
  deliveryFee: number
  totalAmount: number
  notes: string
  createdAt: string
  updatedAt: string
  items: Array<{
    id: number
    productId: number
    productName: string
    productPrice: number
    quantity: number
    totalPrice: number
  }>
}

export function OrderReceiptModal({ isOpen, onClose, orderId }: OrderReceiptModalProps) {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch order details when modal opens
  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails()
    }
  }, [isOpen, orderId])

  const fetchOrderDetails = async () => {
    if (!orderId) return

    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/orders/${orderId}`)
      
      if (response.ok) {
        const data = await response.json()
        setOrderDetails(data.order)
      } else {
        setError('Failed to load order details')
      }
    } catch (err) {
      setError('Failed to load order details')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-green-100 text-green-800"
      case "processing":
        return "bg-blue-100 text-blue-800"
      case "shipped":
        return "bg-purple-100 text-purple-800"
      case "confirmed":
        return "bg-orange-100 text-orange-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    if (!orderDetails) return

    // Create receipt content as HTML
    const receiptContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>EGGMART Receipt - ${orderDetails.orderNumber}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              max-width: 400px;
              margin: 0 auto;
              padding: 20px;
              background: white;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 20px;
              margin-bottom: 20px;
            }
            .header h1 {
              font-size: 24px;
              font-weight: bold;
              margin: 0;
              color: #111827;
            }
            .header p {
              margin: 5px 0;
              color: #6b7280;
            }
            .order-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-bottom: 20px;
            }
            .info-item {
              margin-bottom: 10px;
            }
            .info-label {
              font-size: 12px;
              color: #6b7280;
              margin: 0;
            }
            .info-value {
              font-weight: 600;
              margin: 0;
              color: #111827;
            }
            .status {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: 600;
              text-transform: capitalize;
            }
            .status-delivered { background: #dcfce7; color: #166534; }
            .status-processing { background: #dbeafe; color: #1e40af; }
            .status-shipped { background: #e9d5ff; color: #7c3aed; }
            .status-confirmed { background: #fed7aa; color: #c2410c; }
            .status-pending { background: #fef3c7; color: #d97706; }
            .status-cancelled { background: #fecaca; color: #dc2626; }
            .section {
              margin-bottom: 20px;
            }
            .section-title {
              font-size: 16px;
              font-weight: 600;
              margin-bottom: 10px;
              color: #111827;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .customer-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
            }
            .delivery-payment {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
            }
            .method {
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .method-icon {
              font-size: 20px;
            }
            .items {
              background: #f9fafb;
              border-radius: 8px;
              padding: 15px;
            }
            .item {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 8px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .item:last-child {
              border-bottom: none;
            }
            .item-name {
              font-weight: 500;
              color: #111827;
            }
            .item-details {
              font-size: 12px;
              color: #6b7280;
            }
            .item-price {
              font-weight: 600;
              color: #111827;
            }
            .summary {
              background: #f9fafb;
              border-radius: 8px;
              padding: 15px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
            }
            .summary-total {
              font-size: 18px;
              font-weight: bold;
              border-top: 2px solid #e5e7eb;
              padding-top: 10px;
              margin-top: 10px;
            }
            .notes {
              background: #f9fafb;
              border-radius: 8px;
              padding: 15px;
              margin-top: 20px;
            }
            .notes-title {
              font-weight: 600;
              margin-bottom: 8px;
              color: #111827;
            }
            .notes-content {
              color: #374151;
              line-height: 1.5;
            }
            .separator {
              border-top: 1px solid #e5e7eb;
              margin: 20px 0;
            }
            @media print {
              body { margin: 0; padding: 10px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div style="text-align: center; margin-bottom: 10px;">
              <img src="/logo.png" alt="EggMart Logo" style="height: 32px; width: auto; max-width: 200px;" />
            </div>
            <p>Fresh Eggs & Chicks Store</p>
            <p>Order Receipt</p>
          </div>

          <div class="order-info">
            <div class="info-item">
              <p class="info-label">Order Number</p>
              <p class="info-value">${orderDetails.orderNumber}</p>
            </div>
            <div class="info-item">
              <p class="info-label">Status</p>
              <span class="status status-${orderDetails.status}">${orderDetails.status}</span>
            </div>
            <div class="info-item">
              <p class="info-label">Order Date</p>
              <p class="info-value">${formatDate(orderDetails.createdAt)}</p>
            </div>
            <div class="info-item">
              <p class="info-label">Last Updated</p>
              <p class="info-value">${formatDate(orderDetails.updatedAt)}</p>
            </div>
          </div>

          <div class="separator"></div>

          <div class="section">
            <h3 class="section-title">👤 Customer Information</h3>
            <div class="customer-info">
              <div class="info-item">
                <p class="info-label">Name</p>
                <p class="info-value">${orderDetails.customerName}</p>
              </div>
              <div class="info-item">
                <p class="info-label">Email</p>
                <p class="info-value">${orderDetails.customerEmail}</p>
              </div>
              <div class="info-item">
                <p class="info-label">Phone</p>
                <p class="info-value">${orderDetails.customerPhone}</p>
              </div>
              <div class="info-item">
                <p class="info-label">Address</p>
                <p class="info-value">${orderDetails.customerAddress || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div class="separator"></div>

          <div class="section">
            <div class="delivery-payment">
              <div>
                <h3 class="section-title">🚚 Delivery Method</h3>
                <div class="method">
                  <span class="method-icon">${orderDetails.deliveryMethod === "pickup" ? "🏪" : "🚚"}</span>
                  <span>${orderDetails.deliveryMethod === "pickup" ? "Store Pickup" : "Home Delivery"}</span>
                </div>
              </div>
              <div>
                <h3 class="section-title">💳 Payment Method</h3>
                <div class="method">
                  <span class="method-icon">${orderDetails.paymentMethod === "gcash" ? "📱" : "💵"}</span>
                  <span>${orderDetails.paymentMethod === "cod" ? "Cash on Delivery" : 
                         orderDetails.paymentMethod === "gcash" ? "GCash" : "Store Payment"}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="separator"></div>

          <div class="section">
            <h3 class="section-title">📦 Order Items</h3>
            <div class="items">
              ${orderDetails.items.map(item => `
                <div class="item">
                  <div>
                    <div class="item-name">${item.productName}</div>
                    <div class="item-details">₱${item.productPrice} × ${item.quantity}</div>
                  </div>
                  <div class="item-price">₱${item.totalPrice}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="separator"></div>

          <div class="section">
            <div class="summary">
              <div class="summary-row">
                <span>Subtotal:</span>
                <span>₱${orderDetails.subtotal}</span>
              </div>
              <div class="summary-row">
                <span>Delivery Fee:</span>
                <span>₱${orderDetails.deliveryFee}</span>
              </div>
              <div class="summary-row summary-total">
                <span>Total:</span>
                <span>₱${orderDetails.totalAmount}</span>
              </div>
            </div>
          </div>

          ${orderDetails.notes ? `
            <div class="notes">
              <div class="notes-title">Special Instructions</div>
              <div class="notes-content">${orderDetails.notes}</div>
            </div>
          ` : ''}

          <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px;">
            <p>Thank you for choosing EGGMART!</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `

    // Create blob and download
    const blob = new Blob([receiptContent], { type: 'text/html' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `EGGMART-Receipt-${orderDetails.orderNumber}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Order Receipt
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading order details...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600">Error: {error}</p>
            <Button onClick={fetchOrderDetails} className="mt-4">
              Try Again
            </Button>
          </div>
        ) : orderDetails ? (
          <div className="space-y-6">
            {/* Receipt Header */}
            <div className="text-center border-b pb-4">
              <div className="flex justify-center mb-2">
                <Image 
                  src="/logo.png" 
                  alt="EggMart Logo" 
                  width={120} 
                  height={40} 
                  className="h-8 w-auto sm:h-10 md:h-12"
                />
              </div>
              <p className="text-gray-600">Fresh Eggs & Chicks Store</p>
              <p className="text-sm text-gray-500">Order Receipt</p>
            </div>

            {/* Order Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Order Number</p>
                <p className="font-semibold">{orderDetails.orderNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <Badge className={getStatusColor(orderDetails.status)}>
                  {orderDetails.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">Order Date</p>
                <p className="font-medium">{formatDate(orderDetails.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="font-medium">{formatDate(orderDetails.updatedAt)}</p>
              </div>
            </div>

            <Separator />

            {/* Customer Information */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium">{orderDetails.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{orderDetails.customerEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{orderDetails.customerPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-medium">{orderDetails.customerAddress || 'N/A'}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Delivery & Payment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Delivery Method
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {orderDetails.deliveryMethod === "pickup" ? "🏪" : "🚚"}
                  </span>
                  <span className="capitalize font-medium">
                    {orderDetails.deliveryMethod === "pickup" ? "Store Pickup" : "Home Delivery"}
                  </span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Method
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">
                    {orderDetails.paymentMethod === "gcash" ? "📱" : "💵"}
                  </span>
                  <span className="capitalize font-medium">
                    {orderDetails.paymentMethod === "cod" ? "Cash on Delivery" : 
                     orderDetails.paymentMethod === "gcash" ? "GCash" : "Store Payment"}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Order Items */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Items
              </h3>
              <div className="space-y-3">
                {orderDetails.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-sm text-gray-600">
                        ₱{item.productPrice} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold">₱{item.totalPrice}</p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Order Summary */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₱{orderDetails.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee:</span>
                <span>₱{orderDetails.deliveryFee}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>₱{orderDetails.totalAmount}</span>
              </div>
            </div>

            {/* Notes */}
            {orderDetails.notes && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Special Instructions</h3>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {orderDetails.notes}
                  </p>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button onClick={handleDownload} variant="outline" className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button onClick={handlePrint} variant="outline" className="flex-1">
                Print Receipt
              </Button>
              <Button onClick={onClose} className="flex-1 bg-pink-500 hover:bg-pink-600">
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
