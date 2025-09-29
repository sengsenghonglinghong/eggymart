"use client"

import { useState, useEffect } from "react"
import { Eye, Edit, Search, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Order {
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
  itemCount: number
  items: string
  createdAt: string
}

export function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [pendingCancellation, setPendingCancellation] = useState<{ orderId: number; newStatus: string } | null>(null)
  
  // Download dialog state
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false)
  const [downloadRangeType, setDownloadRangeType] = useState("single") // "single" or "range"
  const [selectedDownloadMonth, setSelectedDownloadMonth] = useState("")
  const [selectedDownloadYear, setSelectedDownloadYear] = useState("2025")
  const [selectedStartMonth, setSelectedStartMonth] = useState("")
  const [selectedEndMonth, setSelectedEndMonth] = useState("")
  const [selectedStartYear, setSelectedStartYear] = useState("2025")
  const [selectedEndYear, setSelectedEndYear] = useState("2025")

  // Fetch orders from database
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/orders')
        if (!response.ok) {
          throw new Error('Failed to fetch orders')
        }
        const data = await response.json()
        setOrders(data.orders)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load orders')
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || order.status.toLowerCase() === statusFilter.toLowerCase()
    return matchesSearch && matchesStatus
  })

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

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    // If cancelling an order, show confirmation dialog
    if (newStatus === 'cancelled') {
      setPendingCancellation({ orderId, newStatus })
      return
    }
    
    await performStatusUpdate(orderId, newStatus)
  }

  const performStatusUpdate = async (orderId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        const result = await response.json()
        
        // Update local state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId ? { ...order, status: newStatus } : order
          )
        )
        
        
        // Show appropriate success message
        if (result.stockUpdated) {
          if (newStatus === 'cancelled') {
            alert('Order cancelled successfully! Stock has been restored for all items.')
          } else {
            alert('Order status updated successfully! Stock has been adjusted accordingly.')
          }
        } else {
          alert('Order status updated successfully!')
        }
      } else {
        const errorData = await response.json()
        alert(`Failed to update order: ${errorData.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to update order status:', error)
      alert('Failed to update order status. Please try again.')
    }
  }

  const confirmCancellation = () => {
    if (pendingCancellation) {
      performStatusUpdate(pendingCancellation.orderId, pendingCancellation.newStatus)
      setPendingCancellation(null)
    }
  }

  const downloadReceipt = async (orderId: number) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/receipt`)
      if (!response.ok) {
        throw new Error('Failed to fetch receipt data')
      }
      
      const data = await response.json()
      const receipt = data.receipt

      // Generate receipt HTML
      const receiptHTML = generateReceiptHTML(receipt)
      
      // Create and download the receipt
      const blob = new Blob([receiptHTML], { type: 'text/html' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `receipt-${receipt.order.orderNumber}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading receipt:', error)
      alert('Failed to download receipt')
    }
  }

  const handleDownloadOrders = () => {
    if (downloadRangeType === "single") {
      if (!selectedDownloadMonth) {
        alert("Please select a month to download")
        return
      }

      // Filter orders for the selected month
      const monthOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt)
        const orderMonth = orderDate.toLocaleDateString('en-US', { month: 'short' })
        const orderYear = orderDate.getFullYear().toString()
        return orderMonth === selectedDownloadMonth && orderYear === selectedDownloadYear
      })

      if (monthOrders.length === 0) {
        alert("No orders found for the selected month")
        return
      }

      try {
        // Create CSV content
        const csvContent = `Orders Report - ${selectedDownloadMonth} ${selectedDownloadYear}
Order Number,Customer Name,Email,Phone,Status,Delivery Method,Payment Method,Subtotal,Delivery Fee,Total Amount,Item Count,Created Date
${monthOrders.map(order => 
  `${order.orderNumber},"${order.customerName}","${order.customerEmail}","${order.customerPhone}","${order.status}","${order.deliveryMethod}","${order.paymentMethod}",${order.subtotal},${order.deliveryFee},${order.totalAmount},${order.itemCount},"${new Date(order.createdAt).toLocaleDateString()}"`
).join('\n')}`

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `orders-report-${selectedDownloadMonth}-${selectedDownloadYear}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)

        setDownloadDialogOpen(false)
        setSelectedDownloadMonth("")
      } catch (error) {
        console.error('Error downloading orders report:', error)
        alert('Failed to download report. Please try again.')
      }
    } else {
      // Date range download
      if (!selectedStartMonth || !selectedEndMonth) {
        alert("Please select both start and end months")
        return
      }

      // Create array of months between start and end
      const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ]
      
      const startIndex = months.indexOf(selectedStartMonth)
      const endIndex = months.indexOf(selectedEndMonth)
      
      if (startIndex === -1 || endIndex === -1) {
        alert("Invalid month selection")
        return
      }

      const selectedMonths = []
      if (startIndex <= endIndex) {
        // Same year range
        for (let i = startIndex; i <= endIndex; i++) {
          selectedMonths.push(months[i])
        }
      } else {
        // Cross year range
        for (let i = startIndex; i < 12; i++) {
          selectedMonths.push(months[i])
        }
        for (let i = 0; i <= endIndex; i++) {
          selectedMonths.push(months[i])
        }
      }

      // Filter orders for the selected date range
      const rangeOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt)
        const orderMonth = orderDate.toLocaleDateString('en-US', { month: 'short' })
        const orderYear = orderDate.getFullYear().toString()
        return selectedMonths.includes(orderMonth) && 
               (orderYear === selectedStartYear || orderYear === selectedEndYear)
      })

      if (rangeOrders.length === 0) {
        alert("No orders found for the selected date range")
        return
      }

      try {
        // Create CSV content with range data
        const csvContent = `Orders Report - ${selectedStartMonth} ${selectedStartYear} to ${selectedEndMonth} ${selectedEndYear}
Order Number,Customer Name,Email,Phone,Status,Delivery Method,Payment Method,Subtotal,Delivery Fee,Total Amount,Item Count,Created Date
${rangeOrders.map(order => 
  `${order.orderNumber},"${order.customerName}","${order.customerEmail}","${order.customerPhone}","${order.status}","${order.deliveryMethod}","${order.paymentMethod}",${order.subtotal},${order.deliveryFee},${order.totalAmount},${order.itemCount},"${new Date(order.createdAt).toLocaleDateString()}"`
).join('\n')}`

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `orders-report-${selectedStartMonth}-${selectedStartYear}-to-${selectedEndMonth}-${selectedEndYear}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)

        setDownloadDialogOpen(false)
        setSelectedStartMonth("")
        setSelectedEndMonth("")
      } catch (error) {
        console.error('Error downloading orders report:', error)
        alert('Failed to download report. Please try again.')
      }
    }
  }

  const generateReceiptHTML = (receipt: any) => {
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP'
      }).format(amount)
    }

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Receipt - ${receipt.order.orderNumber}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
        }
        .receipt {
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 20px;
            margin-bottom: 20px;
        }
        .store-name {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
        }
        .store-details {
            color: #666;
            font-size: 14px;
        }
        .order-info {
            margin-bottom: 20px;
        }
        .order-number {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
        }
        .order-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            font-size: 14px;
        }
        .customer-info {
            margin-bottom: 20px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 5px;
        }
        .customer-title {
            font-weight: bold;
            margin-bottom: 10px;
            color: #333;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .items-table th,
        .items-table td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }
        .items-table th {
            background-color: #f8f9fa;
            font-weight: bold;
        }
        .totals {
            border-top: 2px solid #333;
            padding-top: 15px;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
        }
        .total-final {
            font-weight: bold;
            font-size: 18px;
            border-top: 1px solid #333;
            padding-top: 10px;
            margin-top: 10px;
        }
        .status {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-${receipt.order.status.toLowerCase()} {
            background-color: ${getStatusColorForReceipt(receipt.order.status)};
            color: white;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="receipt">
        <div class="header">
            <div class="store-name">${receipt.store.name}</div>
            <div class="store-details">
                ${receipt.store.address}<br>
                ${receipt.store.phone} | ${receipt.store.email}
            </div>
        </div>

        <div class="order-info">
            <div class="order-number">Order #${receipt.order.orderNumber}</div>
            <div class="order-details">
                <div><strong>Date:</strong> ${formatDate(receipt.order.createdAt)}</div>
                <div><strong>Status:</strong> <span class="status status-${receipt.order.status.toLowerCase()}">${receipt.order.status}</span></div>
                <div><strong>Payment:</strong> ${receipt.order.paymentMethod.toUpperCase()}</div>
                <div><strong>Delivery:</strong> ${receipt.order.deliveryMethod}</div>
            </div>
        </div>

        <div class="customer-info">
            <div class="customer-title">Customer Information</div>
            <div><strong>Name:</strong> ${receipt.order.customerName}</div>
            <div><strong>Email:</strong> ${receipt.order.customerEmail}</div>
            <div><strong>Phone:</strong> ${receipt.order.customerPhone}</div>
            <div><strong>Address:</strong> ${receipt.order.customerAddress}</div>
        </div>

        <table class="items-table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${receipt.items.map((item: any) => `
                    <tr>
                        <td>${item.name}</td>
                        <td>${formatCurrency(item.price)}</td>
                        <td>${item.quantity}</td>
                        <td>${formatCurrency(item.total)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="totals">
            <div class="total-row">
                <span>Subtotal:</span>
                <span>${formatCurrency(receipt.totals.subtotal)}</span>
            </div>
            <div class="total-row">
                <span>Delivery Fee:</span>
                <span>${formatCurrency(receipt.totals.deliveryFee)}</span>
            </div>
            <div class="total-row total-final">
                <span>Total:</span>
                <span>${formatCurrency(receipt.totals.total)}</span>
            </div>
        </div>

        ${receipt.order.notes ? `
            <div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 5px;">
                <strong>Order Notes:</strong><br>
                ${receipt.order.notes}
            </div>
        ` : ''}

        <div class="footer">
            <p>Thank you for your business!</p>
            <p>Generated on ${formatDate(new Date().toISOString())}</p>
        </div>
    </div>
</body>
</html>
    `
  }

  const getStatusColorForReceipt = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return '#10b981'
      case 'processing': return '#3b82f6'
      case 'shipped': return '#8b5cf6'
      case 'confirmed': return '#f59e0b'
      case 'pending': return '#eab308'
      case 'cancelled': return '#ef4444'
      default: return '#6b7280'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Order Management</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search orders..."
                  className="pl-10 w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Dialog open={downloadDialogOpen} onOpenChange={setDownloadDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-transparent">
                    <Download className="w-4 h-4 mr-2" />
                    Download Orders
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Download Orders Report</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Report Type Selection */}
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">Report Type</label>
                      <div className="flex gap-2">
                        <Button
                          variant={downloadRangeType === "single" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setDownloadRangeType("single")}
                          className="flex-1"
                        >
                          Single Month
                        </Button>
                        <Button
                          variant={downloadRangeType === "range" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setDownloadRangeType("range")}
                          className="flex-1"
                        >
                          Date Range
                        </Button>
                      </div>
                    </div>

                    {downloadRangeType === "single" ? (
                      <>
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">Select Month</label>
                          <Select value={selectedDownloadMonth} onValueChange={setSelectedDownloadMonth}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose month" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Jan">January</SelectItem>
                              <SelectItem value="Feb">February</SelectItem>
                              <SelectItem value="Mar">March</SelectItem>
                              <SelectItem value="Apr">April</SelectItem>
                              <SelectItem value="May">May</SelectItem>
                              <SelectItem value="Jun">June</SelectItem>
                              <SelectItem value="Jul">July</SelectItem>
                              <SelectItem value="Aug">August</SelectItem>
                              <SelectItem value="Sep">September</SelectItem>
                              <SelectItem value="Oct">October</SelectItem>
                              <SelectItem value="Nov">November</SelectItem>
                              <SelectItem value="Dec">December</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700 mb-2 block">Select Year</label>
                          <Select value={selectedDownloadYear} onValueChange={setSelectedDownloadYear}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="2025">2025</SelectItem>
                              <SelectItem value="2024">2024</SelectItem>
                              <SelectItem value="2023">2023</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Start Month</label>
                            <Select value={selectedStartMonth} onValueChange={setSelectedStartMonth}>
                              <SelectTrigger>
                                <SelectValue placeholder="Start month" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Jan">January</SelectItem>
                                <SelectItem value="Feb">February</SelectItem>
                                <SelectItem value="Mar">March</SelectItem>
                                <SelectItem value="Apr">April</SelectItem>
                                <SelectItem value="May">May</SelectItem>
                                <SelectItem value="Jun">June</SelectItem>
                                <SelectItem value="Jul">July</SelectItem>
                                <SelectItem value="Aug">August</SelectItem>
                                <SelectItem value="Sep">September</SelectItem>
                                <SelectItem value="Oct">October</SelectItem>
                                <SelectItem value="Nov">November</SelectItem>
                                <SelectItem value="Dec">December</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">End Month</label>
                            <Select value={selectedEndMonth} onValueChange={setSelectedEndMonth}>
                              <SelectTrigger>
                                <SelectValue placeholder="End month" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Jan">January</SelectItem>
                                <SelectItem value="Feb">February</SelectItem>
                                <SelectItem value="Mar">March</SelectItem>
                                <SelectItem value="Apr">April</SelectItem>
                                <SelectItem value="May">May</SelectItem>
                                <SelectItem value="Jun">June</SelectItem>
                                <SelectItem value="Jul">July</SelectItem>
                                <SelectItem value="Aug">August</SelectItem>
                                <SelectItem value="Sep">September</SelectItem>
                                <SelectItem value="Oct">October</SelectItem>
                                <SelectItem value="Nov">November</SelectItem>
                                <SelectItem value="Dec">December</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">Start Year</label>
                            <Select value={selectedStartYear} onValueChange={setSelectedStartYear}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="2025">2025</SelectItem>
                                <SelectItem value="2024">2024</SelectItem>
                                <SelectItem value="2023">2023</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 block">End Year</label>
                            <Select value={selectedEndYear} onValueChange={setSelectedEndYear}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="2025">2025</SelectItem>
                                <SelectItem value="2024">2024</SelectItem>
                                <SelectItem value="2023">2023</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="flex gap-2 pt-4">
                      <Button variant="outline" onClick={() => setDownloadDialogOpen(false)} className="flex-1">
                        Cancel
                      </Button>
                      <Button
                        onClick={handleDownloadOrders}
                        className="flex-1 bg-yellow-500 hover:bg-yellow-600"
                      >
                        Download CSV
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading orders...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">Error: {error}</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No orders found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.customerName}</p>
                        <p className="text-sm text-gray-600">{order.customerPhone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{order.items}</p>
                    </TableCell>
                    <TableCell className="font-medium">₱{order.totalAmount}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="text-lg">{order.paymentMethod === "gcash" ? "📱" : "💵"}</span>
                        <span className="text-sm capitalize">{order.paymentMethod}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="text-lg">{order.deliveryMethod === "pickup" ? "🏪" : "🚚"}</span>
                        <span className="text-sm capitalize">{order.deliveryMethod}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select value={order.status} onValueChange={(value) => updateOrderStatus(order.id, value)}>
                        <SelectTrigger className="w-auto">
                          <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" title="View Details">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Edit Order">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          title="Download Receipt"
                          onClick={() => downloadReceipt(order.id)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Cancellation Confirmation Dialog */}
      <AlertDialog open={!!pendingCancellation} onOpenChange={() => setPendingCancellation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Order Cancellation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this order? This action will:
              <br />
              <br />
              • Restore the stock for all items in this order
              <br />
              • Change the order status to "Cancelled"
              <br />
              • This action cannot be undone
              <br />
              <br />
              <strong>Order ID:</strong> {pendingCancellation?.orderId}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmCancellation}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Yes, Cancel Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
