"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Eye, Edit, Trash2, TrendingUp, Calendar, DollarSign, Tag, Clock, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProductSelectionModal } from "@/components/product-selection-modal"
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

interface Sale {
  id: number
  productId: number
  productName: string
  productStock: number
  categoryName: string
  productImage: string
  originalPrice: number
  salePrice: number
  discountPercentage: number
  quantityAvailable: number
  quantitySold: number
  startDate: string
  endDate: string
  status: string
  createdAt: string
  updatedAt: string
}

interface Product {
  id: number
  name: string
  price: number
  stock: number
  category: string
  image: string
}

export function SalesManagement() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isProductSelectionOpen, setIsProductSelectionOpen] = useState(false)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [editingSale, setEditingSale] = useState<Sale | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [newSale, setNewSale] = useState({
    originalPrice: "",
    salePrice: "",
    discountPercentage: "",
    quantityAvailable: "",
    startDate: "",
    endDate: "",
  })
  
  // Download dialog state
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false)
  const [downloadRangeType, setDownloadRangeType] = useState("single") // "single" or "range"
  const [selectedDownloadMonth, setSelectedDownloadMonth] = useState("")
  const [selectedDownloadYear, setSelectedDownloadYear] = useState("2025")
  const [selectedStartMonth, setSelectedStartMonth] = useState("")
  const [selectedEndMonth, setSelectedEndMonth] = useState("")
  const [selectedStartYear, setSelectedStartYear] = useState("2025")
  const [selectedEndYear, setSelectedEndYear] = useState("2025")

  // Fetch sales data
  useEffect(() => {
    fetchSales()
  }, [])

  const fetchSales = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/sales')
      if (response.ok) {
        const data = await response.json()
        setSales(data.sales || [])
      } else {
        setError('Failed to fetch sales data')
      }
    } catch (err) {
      setError('Failed to fetch sales data')
    } finally {
      setLoading(false)
    }
  }

  const filteredSales = sales.filter(
    (sale) => {
      const matchesSearch = sale.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === "all" || sale.status === statusFilter
      
      return matchesSearch && matchesStatus
    }
  )

  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.salePrice * sale.quantitySold), 0)
  const activeSales = sales.filter((sale) => sale.status === "active").length
  const expiredSales = sales.filter((sale) => sale.status === "expired").length

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product)
    setNewSale({
      originalPrice: product.price.toString(),
      salePrice: "",
      discountPercentage: "",
      quantityAvailable: "",
      startDate: "",
      endDate: "",
    })
    setIsProductSelectionOpen(false)
    setIsAddDialogOpen(true)
  }

  const calculateDiscount = (originalPrice: number, salePrice: number) => {
    return ((originalPrice - salePrice) / originalPrice) * 100
  }

  const calculateSalePrice = (originalPrice: number, discountPercentage: number) => {
    return originalPrice * (1 - discountPercentage / 100)
  }

  const handleRefreshSales = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/sales')
      if (!response.ok) {
        throw new Error('Failed to fetch sales')
      }
      const data = await response.json()
      setSales(data.sales || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh sales')
    } finally {
      setLoading(false)
    }
  }

  const handleAddSale = async () => {
    if (!selectedProduct || !newSale.salePrice || !newSale.quantityAvailable || !newSale.startDate || !newSale.endDate) {
      alert("Please fill in all required fields")
      return
    }

    try {
      const response = await fetch('/api/admin/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          originalPrice: parseFloat(newSale.originalPrice),
          salePrice: parseFloat(newSale.salePrice),
          discountPercentage: parseFloat(newSale.discountPercentage),
          quantityAvailable: parseInt(newSale.quantityAvailable),
          startDate: newSale.startDate,
          endDate: newSale.endDate
        })
      })

      if (response.ok) {
        fetchSales() // Refresh the sales list
        setIsAddDialogOpen(false)
        setSelectedProduct(null)
        setNewSale({
          originalPrice: "",
          salePrice: "",
          discountPercentage: "",
          quantityAvailable: "",
          startDate: "",
          endDate: "",
        })
        alert('Sale created successfully!')
      } else {
        const errorData = await response.json()
        alert(`Failed to create sale: ${errorData.error}`)
      }
    } catch (error) {
      console.error('Failed to create sale:', error)
      alert('Failed to create sale. Please try again.')
    }
  }

  const handleDeleteSale = async (saleId: number) => {
    try {
      const response = await fetch(`/api/admin/sales/${saleId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchSales() // Refresh the sales list
        alert('Sale deleted successfully!')
      } else {
        alert('Failed to delete sale')
      }
    } catch (error) {
      console.error('Failed to delete sale:', error)
      alert('Failed to delete sale. Please try again.')
    }
  }

  const handleViewSale = (sale: Sale) => {
    setSelectedSale(sale)
    setIsViewDialogOpen(true)
  }

  const handleEditClick = (sale: Sale) => {
    if (sale.status === 'expired') {
      alert('Cannot edit expired sales')
      return
    }
    
    setEditingSale(sale)
    setNewSale({
      originalPrice: sale.originalPrice.toString(),
      salePrice: sale.salePrice.toString(),
      discountPercentage: sale.discountPercentage.toString(),
      quantityAvailable: sale.quantityAvailable.toString(),
      startDate: sale.startDate.split('T')[0], // Convert to YYYY-MM-DD format
      endDate: sale.endDate.split('T')[0], // Convert to YYYY-MM-DD format
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateSale = async () => {
    if (!editingSale || !newSale.salePrice || !newSale.quantityAvailable || !newSale.startDate || !newSale.endDate) {
      alert("Please fill in all required fields")
      return
    }

    try {
      const response = await fetch(`/api/admin/sales/${editingSale.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalPrice: parseFloat(newSale.originalPrice),
          salePrice: parseFloat(newSale.salePrice),
          discountPercentage: parseFloat(newSale.discountPercentage),
          quantityAvailable: parseInt(newSale.quantityAvailable),
          startDate: newSale.startDate,
          endDate: newSale.endDate,
          status: editingSale.status
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update sale')
      }

      // Refresh the sales list
      await handleRefreshSales()
      
      // Close dialog and reset state
      setIsEditDialogOpen(false)
      setEditingSale(null)
      setNewSale({
        originalPrice: "",
        salePrice: "",
        discountPercentage: "",
        quantityAvailable: "",
        startDate: "",
        endDate: "",
      })
      
      alert("Sale updated successfully!")
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update sale')
    }
  }

  const handleDownloadSales = () => {
    if (downloadRangeType === "single") {
      if (!selectedDownloadMonth) {
        alert("Please select a month to download")
        return
      }

      // Filter sales for the selected month (based on creation date)
      const monthSales = sales.filter(sale => {
        const saleDate = new Date(sale.createdAt)
        const saleMonth = saleDate.toLocaleDateString('en-US', { month: 'short' })
        const saleYear = saleDate.getFullYear().toString()
        return saleMonth === selectedDownloadMonth && saleYear === selectedDownloadYear
      })

      if (monthSales.length === 0) {
        alert("No sales found for the selected month")
        return
      }

      try {
        // Create CSV content
        const csvContent = `Sales Report - ${selectedDownloadMonth} ${selectedDownloadYear}
Sale ID,Product Name,Category,Original Price,Sale Price,Discount %,Quantity Available,Quantity Sold,Start Date,End Date,Status,Created Date
${monthSales.map(sale => 
  `${sale.id},"${sale.productName}","${sale.categoryName}",${sale.originalPrice},${sale.salePrice},${sale.discountPercentage},${sale.quantityAvailable},${sale.quantitySold},"${sale.startDate}","${sale.endDate}","${sale.status}","${new Date(sale.createdAt).toLocaleDateString()}"`
).join('\n')}`

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `sales-report-${selectedDownloadMonth}-${selectedDownloadYear}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)

        setDownloadDialogOpen(false)
        setSelectedDownloadMonth("")
      } catch (error) {
        console.error('Error downloading sales report:', error)
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

      // Filter sales for the selected date range
      const rangeSales = sales.filter(sale => {
        const saleDate = new Date(sale.createdAt)
        const saleMonth = saleDate.toLocaleDateString('en-US', { month: 'short' })
        const saleYear = saleDate.getFullYear().toString()
        return selectedMonths.includes(saleMonth) && 
               (saleYear === selectedStartYear || saleYear === selectedEndYear)
      })

      if (rangeSales.length === 0) {
        alert("No sales found for the selected date range")
        return
      }

      try {
        // Create CSV content with range data
        const csvContent = `Sales Report - ${selectedStartMonth} ${selectedStartYear} to ${selectedEndMonth} ${selectedEndYear}
Sale ID,Product Name,Category,Original Price,Sale Price,Discount %,Quantity Available,Quantity Sold,Start Date,End Date,Status,Created Date
${rangeSales.map(sale => 
  `${sale.id},"${sale.productName}","${sale.categoryName}",${sale.originalPrice},${sale.salePrice},${sale.discountPercentage},${sale.quantityAvailable},${sale.quantitySold},"${sale.startDate}","${sale.endDate}","${sale.status}","${new Date(sale.createdAt).toLocaleDateString()}"`
).join('\n')}`

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `sales-report-${selectedStartMonth}-${selectedStartYear}-to-${selectedEndMonth}-${selectedEndYear}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)

        setDownloadDialogOpen(false)
        setSelectedStartMonth("")
        setSelectedEndMonth("")
      } catch (error) {
        console.error('Error downloading sales report:', error)
        alert('Failed to download report. Please try again.')
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      case "expired":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Sales Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue from Sales</p>
                <p className="text-2xl font-bold text-gray-900">₱{totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Sales</p>
                <p className="text-2xl font-bold text-gray-900">{activeSales}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expired Sales</p>
                <p className="text-2xl font-bold text-gray-900">{expiredSales}</p>
              </div>
              <Calendar className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Management Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">Sales Management</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Manage and track all sales transactions</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search sales..."
                  className="pl-10 w-64 bg-gray-50 border-gray-200 focus:bg-white focus:border-yellow-400 focus:ring-yellow-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={handleRefreshSales}
                  disabled={loading}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Dialog open={downloadDialogOpen} onOpenChange={setDownloadDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="bg-transparent">
                      <Download className="w-4 h-4 mr-2" />
                      Download Sales
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Download Sales Report</DialogTitle>
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
                          onClick={handleDownloadSales}
                          className="flex-1 bg-yellow-500 hover:bg-yellow-600"
                        >
                          Download CSV
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Button 
                  className="bg-yellow-500 hover:bg-yellow-600 text-white"
                  onClick={() => setIsProductSelectionOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Sale
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading sales...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">Error: {error}</p>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="text-center py-8">
              <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No sales found</p>
              <p className="text-sm text-gray-500">Create your first promotional sale</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Original Price</TableHead>
                  <TableHead>Sale Price</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Sold</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={sale.productImage}
                          alt={sale.productName}
                          className="w-10 h-10 object-cover rounded"
                        />
                        <div>
                          <p className="font-medium text-sm">{sale.productName}</p>
                          <p className="text-xs text-gray-500">{sale.categoryName}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>₱{sale.originalPrice}</TableCell>
                    <TableCell className="font-semibold text-green-600">₱{sale.salePrice}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-red-600 border-red-200">
                        -{sale.discountPercentage}%
                      </Badge>
                    </TableCell>
                    <TableCell>{sale.quantityAvailable}</TableCell>
                    <TableCell>{sale.quantitySold}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{new Date(sale.startDate).toLocaleDateString()}</p>
                        <p className="text-gray-500">to {new Date(sale.endDate).toLocaleDateString()}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(sale.status)}>
                        {sale.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleViewSale(sale)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEditClick(sale)}
                          disabled={sale.status === 'expired'}
                          title={sale.status === 'expired' ? 'Cannot edit expired sales' : 'Edit sale'}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Sale</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this sale? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteSale(sale.id)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Product Selection Modal */}
      <ProductSelectionModal
        isOpen={isProductSelectionOpen}
        onClose={() => setIsProductSelectionOpen(false)}
        onSelect={handleProductSelect}
      />

      {/* Add Sale Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Sale</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div>
                    <p className="font-medium">{selectedProduct.name}</p>
                    <p className="text-sm text-gray-600">{selectedProduct.category}</p>
                    <p className="text-sm text-gray-600">Stock: {selectedProduct.stock}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="original-price">Original Price (₱) *</Label>
                <Input
                  id="original-price"
                  type="number"
                  value={newSale.originalPrice}
                  onChange={(e) => setNewSale((prev) => ({ ...prev, originalPrice: e.target.value }))}
                  placeholder="0"
                />
              </div>
              
              <div>
                <Label htmlFor="sale-price">Sale Price (₱) *</Label>
                <Input
                  id="sale-price"
                  type="number"
                  value={newSale.salePrice}
                  onChange={(e) => {
                    const salePrice = parseFloat(e.target.value)
                    const originalPrice = parseFloat(newSale.originalPrice)
                    const discountPercentage = originalPrice > 0 ? calculateDiscount(originalPrice, salePrice) : 0
                    setNewSale((prev) => ({ 
                      ...prev, 
                      salePrice: e.target.value,
                      discountPercentage: discountPercentage.toFixed(2)
                    }))
                  }}
                  placeholder="0"
                />
              </div>
              
              <div>
                <Label htmlFor="discount-percentage">Discount Percentage (%)</Label>
                <Input
                  id="discount-percentage"
                  type="number"
                  value={newSale.discountPercentage}
                  onChange={(e) => {
                    const discountPercentage = parseFloat(e.target.value)
                    const originalPrice = parseFloat(newSale.originalPrice)
                    const salePrice = originalPrice > 0 ? calculateSalePrice(originalPrice, discountPercentage) : 0
                    setNewSale((prev) => ({ 
                      ...prev, 
                      discountPercentage: e.target.value,
                      salePrice: salePrice.toFixed(2)
                    }))
                  }}
                  placeholder="0"
                />
              </div>
              
              <div>
                <Label htmlFor="quantity-available">Quantity Available *</Label>
                <Input
                  id="quantity-available"
                  type="number"
                  max={selectedProduct.stock}
                  value={newSale.quantityAvailable}
                  onChange={(e) => setNewSale((prev) => ({ ...prev, quantityAvailable: e.target.value }))}
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">Max: {selectedProduct.stock}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date">Start Date *</Label>
                  <Input
                    id="start-date"
                    type="datetime-local"
                    value={newSale.startDate}
                    onChange={(e) => setNewSale((prev) => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">End Date *</Label>
                  <Input
                    id="end-date"
                    type="datetime-local"
                    value={newSale.endDate}
                    onChange={(e) => setNewSale((prev) => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleAddSale} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white">
                  Create Sale
                </Button>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Sale Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sale Details</DialogTitle>
          </DialogHeader>
          {selectedSale && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedSale.productImage}
                    alt={selectedSale.productName}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div>
                    <p className="font-medium">{selectedSale.productName}</p>
                    <p className="text-sm text-gray-600">{selectedSale.categoryName}</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Original Price</Label>
                  <p className="text-sm text-gray-600">₱{selectedSale.originalPrice}</p>
                </div>
                <div>
                  <Label>Sale Price</Label>
                  <p className="text-sm font-semibold text-green-600">₱{selectedSale.salePrice}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Discount</Label>
                  <p className="text-sm text-red-600">-{selectedSale.discountPercentage}%</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={getStatusColor(selectedSale.status)}>
                    {selectedSale.status}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Quantity Available</Label>
                  <p className="text-sm text-gray-600">{selectedSale.quantityAvailable}</p>
                </div>
                <div>
                  <Label>Quantity Sold</Label>
                  <p className="text-sm text-gray-600">{selectedSale.quantitySold}</p>
                </div>
              </div>
              
              <div>
                <Label>Duration</Label>
                <p className="text-sm text-gray-600">
                  {new Date(selectedSale.startDate).toLocaleDateString()} - {new Date(selectedSale.endDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Sale Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Sale</DialogTitle>
          </DialogHeader>
          {editingSale && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <img
                    src={editingSale.productImage}
                    alt={editingSale.productName}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div>
                    <p className="font-medium">{editingSale.productName}</p>
                    <p className="text-sm text-gray-600">{editingSale.categoryName}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-original-price">Original Price (₱)</Label>
                  <Input
                    id="edit-original-price"
                    type="number"
                    step="0.01"
                    value={newSale.originalPrice}
                    onChange={(e) => setNewSale(prev => ({ ...prev, originalPrice: e.target.value }))}
                    placeholder="Enter original price"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-sale-price">Sale Price (₱)</Label>
                  <Input
                    id="edit-sale-price"
                    type="number"
                    step="0.01"
                    value={newSale.salePrice}
                    onChange={(e) => {
                      const salePrice = parseFloat(e.target.value)
                      const originalPrice = parseFloat(newSale.originalPrice)
                      const discountPercentage = originalPrice > 0 ? ((originalPrice - salePrice) / originalPrice) * 100 : 0
                      setNewSale(prev => ({ 
                        ...prev, 
                        salePrice: e.target.value,
                        discountPercentage: discountPercentage.toFixed(2)
                      }))
                    }}
                    placeholder="Enter sale price"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-discount">Discount Percentage (%)</Label>
                  <Input
                    id="edit-discount"
                    type="number"
                    step="0.01"
                    value={newSale.discountPercentage}
                    onChange={(e) => {
                      const discountPercentage = parseFloat(e.target.value)
                      const originalPrice = parseFloat(newSale.originalPrice)
                      const salePrice = originalPrice * (1 - discountPercentage / 100)
                      setNewSale(prev => ({ 
                        ...prev, 
                        discountPercentage: e.target.value,
                        salePrice: salePrice.toFixed(2)
                      }))
                    }}
                    placeholder="Enter discount percentage"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-quantity">Quantity Available</Label>
                  <Input
                    id="edit-quantity"
                    type="number"
                    value={newSale.quantityAvailable}
                    onChange={(e) => setNewSale(prev => ({ ...prev, quantityAvailable: e.target.value }))}
                    placeholder="Enter quantity available"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-start-date">Start Date</Label>
                  <Input
                    id="edit-start-date"
                    type="date"
                    value={newSale.startDate}
                    onChange={(e) => setNewSale(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-end-date">End Date</Label>
                  <Input
                    id="edit-end-date"
                    type="date"
                    value={newSale.endDate}
                    onChange={(e) => setNewSale(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateSale} className="bg-yellow-500 hover:bg-yellow-600 text-white">
                  Update Sale
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  )
}
