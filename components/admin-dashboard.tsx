"use client"

import { useState, useEffect } from "react"
import {
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  Plus,
  ArrowLeft,
  Filter,
  BarChart3,
  Calendar,
  DollarSign,
  Download,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import Link from "next/link"
import { ProductManagement } from "./admin-product-management"
import { OrderManagement } from "./admin-order-management"
import { SalesManagement } from "./admin-sales-management"
import { AdminNotifications } from "./admin-notifications"

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [revenueTimeframe, setRevenueTimeframe] = useState("12months")
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false)
  const [selectedDownloadMonth, setSelectedDownloadMonth] = useState("")
  const [selectedDownloadYear, setSelectedDownloadYear] = useState("2025")
  const [downloadRangeType, setDownloadRangeType] = useState("single") // "single" or "range"
  const [selectedStartMonth, setSelectedStartMonth] = useState("")
  const [selectedEndMonth, setSelectedEndMonth] = useState("")
  const [selectedStartYear, setSelectedStartYear] = useState("2025")
  const [selectedEndYear, setSelectedEndYear] = useState("2025")
  
  // Real data state
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/analytics')
        if (response.ok) {
          const data = await response.json()
          setAnalytics(data)
        } else {
          setError('Failed to fetch analytics data')
        }
      } catch (err) {
        setError('Failed to fetch analytics data')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  // Create stats array from real data
  const stats = analytics ? [
    {
      title: "Total Products",
      value: analytics.overview.totalProducts.toString(),
      change: "+0%", // Could calculate from previous period
      icon: Package,
      color: "text-blue-600",
    },
    {
      title: "Total Orders",
      value: analytics.overview.totalOrders.toString(),
      change: "+0%", // Could calculate from previous period
      icon: ShoppingCart,
      color: "text-green-600",
    },
    {
      title: "Customers",
      value: analytics.overview.totalCustomers.toString(),
      change: "+0%", // Could calculate from previous period
      icon: Users,
      color: "text-purple-600",
    },
    {
      title: "Revenue",
      value: `₱${analytics.overview.totalRevenue.toLocaleString()}`,
      change: "+0%", // Could calculate from previous period
      icon: TrendingUp,
      color: "text-yellow-600",
    },
  ] : []

  const handleDownloadRevenue = () => {
    if (downloadRangeType === "single") {
      if (!selectedDownloadMonth) {
        alert("Please select a month to download")
        return
      }

      if (!analytics?.monthlyRevenue) {
        alert("No revenue data available")
        return
      }

      const monthData = analytics.monthlyRevenue.find((data: any) => data.month === selectedDownloadMonth)
      
      if (!monthData) {
        alert("No data found for the selected month")
        return
      }

      try {
        // Create CSV content with actual analytics data
        const csvContent = `Revenue Report - ${selectedDownloadMonth} ${selectedDownloadYear}
Month,Revenue,Orders,Average Order Value,Growth,Top Product,Worst Product
${selectedDownloadMonth} ${selectedDownloadYear},${monthData.revenue?.toLocaleString() || '0'},${monthData.orders || '0'},${monthData.avgOrder || '0'},${monthData.growth || '0'}%,${monthData.topProduct || 'N/A'},${monthData.worstProduct || 'N/A'}`

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `revenue-report-${selectedDownloadMonth}-${selectedDownloadYear}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)

        setDownloadDialogOpen(false)
        setSelectedDownloadMonth("")
      } catch (error) {
        console.error('Error downloading revenue report:', error)
        alert('Failed to download report. Please try again.')
      }
    } else {
      // Date range download
      if (!selectedStartMonth || !selectedEndMonth) {
        alert("Please select both start and end months")
        return
      }

      if (!analytics?.monthlyRevenue) {
        alert("No revenue data available")
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

      // Filter data for selected months
      const rangeData = selectedMonths.map(month => {
        const monthData = analytics.monthlyRevenue.find((data: any) => data.month === month)
        return {
          month,
          year: monthData ? selectedStartYear : selectedEndYear,
          revenue: monthData?.revenue || 0,
          orders: monthData?.orders || 0,
          avgOrder: monthData?.avgOrder || 0,
          growth: monthData?.growth || 0,
          topProduct: monthData?.topProduct || 'N/A',
          worstProduct: monthData?.worstProduct || 'N/A'
        }
      })

      try {
        // Create CSV content with range data
        const csvContent = `Revenue Report - ${selectedStartMonth} ${selectedStartYear} to ${selectedEndMonth} ${selectedEndYear}
Month,Revenue,Orders,Average Order Value,Growth,Top Product,Worst Product
${rangeData.map(data => 
  `${data.month} ${data.year},${data.revenue.toLocaleString()},${data.orders},${data.avgOrder},${data.growth}%,${data.topProduct},${data.worstProduct}`
).join('\n')}`

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `revenue-report-${selectedStartMonth}-${selectedStartYear}-to-${selectedEndMonth}-${selectedEndYear}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)

        setDownloadDialogOpen(false)
        setSelectedStartMonth("")
        setSelectedEndMonth("")
      } catch (error) {
        console.error('Error downloading revenue report:', error)
        alert('Failed to download report. Please try again.')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-amber-50 to-yellow-200">
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl overflow-hidden">
          <div className="p-4 md:p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <Link href="/">
                  <Button variant="ghost" size="icon" className="hover:bg-yellow-50">
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                </Link>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                  <p className="text-sm md:text-base text-gray-600">
                    Manage your egg and chick store
                    {analytics?.notifications && (
                      <span className="ml-2 text-xs">
                        • {analytics.notifications.lowStock.length} low stock
                        • {analytics.notifications.newReviews.length} reviews
                        • {analytics.notifications.newOrders.length} new orders
                        • {analytics.notifications.orderReminders.length} reminders
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AdminNotifications 
                  notifications={analytics?.notifications || { lowStock: [], newReviews: [], newOrders: [], orderReminders: [] }}
                  loading={loading}
                />
                <Button className="bg-yellow-500 hover:bg-yellow-600 text-white text-sm">
                  <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Add Product</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <div className="overflow-x-auto">
                <TabsList className="grid w-full grid-cols-5 min-w-[500px] sm:min-w-0">
                  <TabsTrigger value="overview" className="text-xs sm:text-sm">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="products" className="text-xs sm:text-sm">
                    Products
                  </TabsTrigger>
                  <TabsTrigger value="sales" className="text-xs sm:text-sm">
                    Sales
                  </TabsTrigger>
                  <TabsTrigger value="orders" className="text-xs sm:text-sm">
                    Orders
                  </TabsTrigger>
                  <TabsTrigger value="revenue" className="text-xs sm:text-sm">
                    Revenue
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  {stats.map((stat) => (
                    <Card key={stat.title}>
                      <CardContent className="p-4 md:p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs md:text-sm font-medium text-gray-600">{stat.title}</p>
                            <p className="text-lg md:text-2xl font-bold text-gray-900">{stat.value}</p>
                            <p className="text-xs md:text-sm text-green-600">{stat.change} from last month</p>
                          </div>
                          <stat.icon className={`w-6 h-6 md:w-8 md:h-8 ${stat.color}`} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Recent Activity */}
                <div className="grid lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg md:text-xl">Recent Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500 mx-auto mb-2"></div>
                          <p className="text-gray-600 text-sm">Loading orders...</p>
                        </div>
                      ) : error ? (
                        <div className="text-center py-4">
                          <p className="text-red-600 text-sm">Error loading orders</p>
                        </div>
                      ) : analytics?.recentOrders?.length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-gray-600 text-sm">No recent orders</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {analytics?.recentOrders?.map((order: any) => (
                            <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-semibold text-gray-900 text-sm md:text-base">{order.id}</p>
                                <p className="text-xs md:text-sm text-gray-600">{order.customer}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-gray-900 text-sm md:text-base">{order.amount}</p>
                                <Badge
                                  variant={order.status === "delivered" ? "default" : "secondary"}
                                  className={`text-xs ${order.status === "delivered" ? "bg-green-100 text-green-800" : ""}`}
                                >
                                  {order.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg md:text-xl">Recent Customer Reviews</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500 mx-auto mb-2"></div>
                          <p className="text-gray-600 text-sm">Loading reviews...</p>
                        </div>
                      ) : error ? (
                        <div className="text-center py-4">
                          <p className="text-red-600 text-sm">Error loading reviews</p>
                        </div>
                      ) : analytics?.recentReviews?.length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-gray-600 text-sm">No recent reviews</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {analytics?.recentReviews?.map((review: any) => (
                            <div
                              key={review.id}
                              className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-900 text-sm md:text-base">{review.customerName}</p>
                                  <p className="text-xs md:text-sm text-gray-600">Order #{review.orderNumber}</p>
                                </div>
                                <div className="text-right">
                                  <div className="flex items-center gap-1 mb-1">
                                    {[...Array(5)].map((_, i) => (
                                      <span
                                        key={i}
                                        className={`text-sm ${
                                          i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                                        }`}
                                      >
                                        ★
                                      </span>
                                    ))}
                                  </div>
                                  <p className="text-xs text-gray-500">
                                    {new Date(review.createdAt).toLocaleDateString()} {new Date(review.createdAt).toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>
                              <div className="mb-2">
                                <p className="text-xs md:text-sm text-gray-600 mb-1">Product: {review.productName}</p>
                                {review.reviewText && (
                                  <p className="text-xs md:text-sm text-gray-700 bg-white p-2 rounded border">
                                    "{review.reviewText}"
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Products Tab */}
              <TabsContent value="products">
                <ProductManagement />
              </TabsContent>

              {/* Sales Tab */}
              <TabsContent value="sales">
                <SalesManagement />
              </TabsContent>

              {/* Orders Tab */}
              <TabsContent value="orders">
                <OrderManagement />
              </TabsContent>

              {/* Revenue Analytics Tab */}
              <TabsContent value="revenue" className="space-y-6">
                {/* Revenue Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg md:text-xl font-bold text-gray-900">Revenue Analytics</h2>
                    <p className="text-sm text-gray-600">Track your monthly revenue and performance</p>
                  </div>
                  <Select value={revenueTimeframe} onValueChange={setRevenueTimeframe}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6months">Last 6 Months</SelectItem>
                      <SelectItem value="12months">Last 12 Months</SelectItem>
                      <SelectItem value="24months">Last 24 Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Revenue Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                  <Card>
                    <CardContent className="p-4 md:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs md:text-sm font-medium text-gray-600">Total Revenue</p>
                          <p className="text-lg md:text-2xl font-bold text-gray-900">
                            {loading ? "..." : analytics ? `₱${analytics.overview.totalRevenue.toLocaleString()}` : "₱0"}
                          </p>
                          <p className="text-xs md:text-sm text-green-600">All time</p>
                        </div>
                        <DollarSign className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 md:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs md:text-sm font-medium text-gray-600">Avg Monthly</p>
                          <p className="text-lg md:text-2xl font-bold text-gray-900">
                            {loading ? "..." : analytics ? `₱${Math.round(analytics.overview.totalRevenue / 12).toLocaleString()}` : "₱0"}
                          </p>
                          <p className="text-xs md:text-sm text-green-600">Estimated</p>
                        </div>
                        <Calendar className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 md:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs md:text-sm font-medium text-gray-600">Total Orders</p>
                          <p className="text-lg md:text-2xl font-bold text-gray-900">
                            {loading ? "..." : analytics ? analytics.overview.totalOrders.toString() : "0"}
                          </p>
                          <p className="text-xs md:text-sm text-gray-600">All time</p>
                        </div>
                        <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-yellow-600" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 md:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs md:text-sm font-medium text-gray-600">Avg Order Value</p>
                          <p className="text-lg md:text-2xl font-bold text-gray-900">
                            {loading ? "..." : analytics ? `₱${analytics.overview.totalOrders > 0 ? Math.round(analytics.overview.totalRevenue / analytics.overview.totalOrders) : 0}` : "₱0"}
                          </p>
                          <p className="text-xs md:text-sm text-green-600">Per order</p>
                        </div>
                        <BarChart3 className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Revenue Charts */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Monthly Revenue Trend */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg md:text-xl">Monthly Revenue Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="h-64 md:h-80 flex items-center justify-center">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading chart data...</p>
                          </div>
                        </div>
                      ) : analytics?.monthlyRevenue?.length === 0 ? (
                        <div className="h-64 md:h-80 flex items-center justify-center">
                          <p className="text-gray-600">No revenue data available</p>
                        </div>
                      ) : (
                        <div className="h-64 md:h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={analytics?.monthlyRevenue || []}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="month" />
                              <YAxis />
                              <Tooltip
                                formatter={(value) => [`₱${value.toLocaleString()}`, "Revenue"]}
                                labelFormatter={(label) => `Month: ${label}`}
                              />
                              <Line
                                type="monotone"
                                dataKey="revenue"
                                stroke="#eab308"
                                strokeWidth={3}
                                dot={{ fill: "#eab308", strokeWidth: 2, r: 4 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Revenue by Category */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg md:text-xl">Revenue by Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="h-64 md:h-80 flex items-center justify-center">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
                            <p className="text-gray-600">Loading chart data...</p>
                          </div>
                        </div>
                      ) : analytics?.revenueByCategory?.length === 0 ? (
                        <div className="h-64 md:h-80 flex items-center justify-center">
                          <p className="text-gray-600">No category revenue data available</p>
                        </div>
                      ) : (
                        <div className="h-64 md:h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics?.revenueByCategory || []}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="category" />
                              <YAxis />
                              <Tooltip formatter={(value) => [`₱${value.toLocaleString()}`, "Revenue"]} />
                              <Bar dataKey="revenue" fill="#eab308" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Revenue Details Table */}
                <Card>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <CardTitle className="text-lg md:text-xl">Monthly Revenue Details</CardTitle>
                      <Dialog open={downloadDialogOpen} onOpenChange={setDownloadDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="bg-transparent">
                            <Download className="w-4 h-4 mr-2" />
                            Download Report
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg">
                          <DialogHeader>
                            <DialogTitle>Download Revenue Report</DialogTitle>
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
                                      {analytics?.monthlyRevenue?.map((month: any) => (
                                        <SelectItem key={month.month} value={month.month}>
                                          {month.month}
                                        </SelectItem>
                                      )) || []}
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
                                onClick={handleDownloadRevenue}
                                className="flex-1 bg-yellow-500 hover:bg-yellow-600"
                              >
                                Download CSV
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table className="min-w-[600px]">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Month</TableHead>
                            <TableHead>Revenue</TableHead>
                            <TableHead>Orders</TableHead>
                            <TableHead>Avg Order Value</TableHead>
                            <TableHead>Growth</TableHead>
                            <TableHead>Top Product</TableHead>
                            <TableHead>Worst Product</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {loading ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-500 mx-auto mb-2"></div>
                                <p className="text-gray-600">Loading revenue data...</p>
                              </TableCell>
                            </TableRow>
                          ) : analytics?.monthlyRevenue?.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-8">
                                <p className="text-gray-600">No revenue data available</p>
                              </TableCell>
                            </TableRow>
                          ) : (
                            analytics?.monthlyRevenue?.map((month: any, index: number) => {
                              const prevMonth = index > 0 ? analytics.monthlyRevenue[index - 1] : null
                              const growth = prevMonth
                                ? (((month.revenue - prevMonth.revenue) / prevMonth.revenue) * 100).toFixed(1)
                                : "0"

                              return (
                                <TableRow key={month.month}>
                                  <TableCell className="font-medium">{month.month} 2025</TableCell>
                                  <TableCell>₱{month.revenue.toLocaleString()}</TableCell>
                                  <TableCell>{month.orders}</TableCell>
                                  <TableCell>₱{month.avgOrder}</TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={Number.parseFloat(growth) >= 0 ? "default" : "destructive"}
                                      className={Number.parseFloat(growth) >= 0 ? "bg-green-100 text-green-800" : ""}
                                    >
                                      {Number.parseFloat(growth) >= 0 ? "+" : ""}
                                      {growth}%
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-sm">
                                      <div className="font-medium text-green-700">N/A</div>
                                      <div className="text-xs text-gray-500">No data</div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="text-sm">
                                      <div className="font-medium text-red-700">N/A</div>
                                      <div className="text-xs text-gray-500">No data</div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )
                            })
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
