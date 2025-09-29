"use client"

import { useEffect, useState } from "react"
import { Edit, Trash2, Eye, Plus, Search, Save, X, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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

const initialProducts: any[] = []

export function ProductManagement() {
  const [products, setProducts] = useState(initialProducts)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [editingProduct, setEditingProduct] = useState(null)
  const [newProduct, setNewProduct] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
    description: "",
    image: "",
  })
  const [newImages, setNewImages] = useState<string[]>([])
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([])
  
  // Download dialog state
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false)
  const [downloadRangeType, setDownloadRangeType] = useState("single") // "single" or "range"
  const [selectedDownloadMonth, setSelectedDownloadMonth] = useState("")
  const [selectedDownloadYear, setSelectedDownloadYear] = useState("2025")
  const [selectedStartMonth, setSelectedStartMonth] = useState("")
  const [selectedEndMonth, setSelectedEndMonth] = useState("")
  const [selectedStartYear, setSelectedStartYear] = useState("2025")
  const [selectedEndYear, setSelectedEndYear] = useState("2025")

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/products')
        if (!res.ok) throw new Error('Failed to load products')
        const data = await res.json()
        setProducts(data.items || [])
      } catch (e: any) {
        setError(e?.message || 'Failed to load products')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const onAddImages = (files: FileList | File[]) => {
    const list = Array.from(files)
    const urls = list.map((f) => URL.createObjectURL(f))
    setNewImages((prev) => [...prev, ...urls].slice(0, 4))
  }

  const onDropAdd = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onAddImages(e.dataTransfer.files)
      e.dataTransfer.clearData()
    }
  }

  const removeNewImage = (idx: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== idx))
    setUploadedImageUrls((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleAddProductClick = () => {
    console.log("[v0] Add Product button clicked")
    setIsAddDialogOpen(true)
    console.log("[v0] Dialog state set to true:", true)
  }

  const handleCloseAddDialog = () => {
    setIsAddDialogOpen(false)
    setNewProduct({ name: "", category: "", price: "", stock: "", description: "", image: "" })
    setNewImages([])
    setUploadedImageUrls([])
  }

  const handleAddImages = async () => {
    if (!newProduct.name || !newProduct.category || !newProduct.price || !newProduct.stock) {
      alert("Please fill in all required fields")
      return
    }
    try {
      console.log('Creating product with images:', uploadedImageUrls)
      console.log('Number of images:', uploadedImageUrls.length)
      console.log('Image URLs:', uploadedImageUrls)

      const requestBody = {
        name: newProduct.name,
        category: newProduct.category,
        price: Number.parseFloat(newProduct.price),
        stock: Number.parseInt(newProduct.stock),
        description: newProduct.description || null,
        images: uploadedImageUrls,
      }
      
      console.log('Request body:', requestBody)

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Failed to create' }))
        alert(data.error || 'Failed to create product')
        return
      }
      // reload list
      const listRes = await fetch('/api/products')
      const listData = await listRes.json()
      setProducts(listData.items || [])
      setIsAddDialogOpen(false)
      setNewProduct({ name: "", category: "", price: "", stock: "", description: "", image: "" })
      setNewImages([])
      setUploadedImageUrls([])
    } catch (e) {
      alert('Failed to create product')
    }
  }

  const handleEditProduct = async () => {
    if (!editingProduct.name || !editingProduct.category || !editingProduct.price || !editingProduct.stock) {
      alert("Please fill in all required fields")
      return
    }
    try {
      // use any uploaded URLs in this session
      const editUploaded: string[] = ((window as any).__uploadedEditImageUrls as string[]) || []
      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingProduct.name,
          category: editingProduct.category,
          price: Number.parseFloat(editingProduct.price),
          stock: Number.parseInt(editingProduct.stock),
          description: editingProduct.description || null,
          images: editUploaded.length > 0 ? editUploaded : undefined,
        })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Failed to update' }))
        alert(data.error || 'Failed to update product')
        return
      }
      const listRes = await fetch('/api/products')
      const listData = await listRes.json()
      setProducts(listData.items || [])
      setIsEditDialogOpen(false)
      setEditingProduct(null)
      ;(window as any).__uploadedEditImageUrls = []
    } catch (e) {
      alert('Failed to update product')
    }
  }

  const handleDeleteProduct = (productId) => {
    fetch(`/api/products/${productId}`, { method: 'DELETE' })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: 'Failed to delete' }))
          alert(data.error || 'Failed to delete')
          return
        }
        setProducts(products.filter((p) => p.id !== productId))
      })
  }

  const handleDownloadProducts = () => {
    if (downloadRangeType === "single") {
      if (!selectedDownloadMonth) {
        alert("Please select a month to download")
        return
      }

      // Filter products for the selected month (based on creation date)
      const monthProducts = products.filter(product => {
        const productDate = new Date(product.created_at || product.createdAt || new Date())
        const productMonth = productDate.toLocaleDateString('en-US', { month: 'short' })
        const productYear = productDate.getFullYear().toString()
        return productMonth === selectedDownloadMonth && productYear === selectedDownloadYear
      })

      if (monthProducts.length === 0) {
        alert("No products found for the selected month")
        return
      }

      try {
        // Create CSV content
        const csvContent = `Products Report - ${selectedDownloadMonth} ${selectedDownloadYear}
Product ID,Name,Category,Price,Stock,Description,Status,Created Date
${monthProducts.map(product => 
  `${product.id},"${product.name}","${product.category}",${product.price},${product.stock},"${product.description?.replace(/"/g, '""') || ''}","${product.status || 'active'}","${new Date(product.created_at || product.createdAt || new Date()).toLocaleDateString()}"`
).join('\n')}`

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `products-report-${selectedDownloadMonth}-${selectedDownloadYear}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)

        setDownloadDialogOpen(false)
        setSelectedDownloadMonth("")
      } catch (error) {
        console.error('Error downloading products report:', error)
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

      // Filter products for the selected date range
      const rangeProducts = products.filter(product => {
        const productDate = new Date(product.created_at || product.createdAt || new Date())
        const productMonth = productDate.toLocaleDateString('en-US', { month: 'short' })
        const productYear = productDate.getFullYear().toString()
        return selectedMonths.includes(productMonth) && 
               (productYear === selectedStartYear || productYear === selectedEndYear)
      })

      if (rangeProducts.length === 0) {
        alert("No products found for the selected date range")
        return
      }

      try {
        // Create CSV content with range data
        const csvContent = `Products Report - ${selectedStartMonth} ${selectedStartYear} to ${selectedEndMonth} ${selectedEndYear}
Product ID,Name,Category,Price,Stock,Description,Status,Created Date
${rangeProducts.map(product => 
  `${product.id},"${product.name}","${product.category}",${product.price},${product.stock},"${product.description?.replace(/"/g, '""') || ''}","${product.status || 'active'}","${new Date(product.created_at || product.createdAt || new Date()).toLocaleDateString()}"`
).join('\n')}`

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `products-report-${selectedStartMonth}-${selectedStartYear}-to-${selectedEndMonth}-${selectedEndYear}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)

        setDownloadDialogOpen(false)
        setSelectedStartMonth("")
        setSelectedEndMonth("")
      } catch (error) {
        console.error('Error downloading products report:', error)
        alert('Failed to download report. Please try again.')
      }
    }
  }

  const handleViewProduct = (product) => {
    setSelectedProduct(product)
    setIsViewDialogOpen(true)
  }

  const handleEditClick = (product) => {
    setEditingProduct({
      ...product,
      price: product.price.toString(),
      stock: product.stock.toString(),
    })
    setIsEditDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-lg md:text-xl">Product Management</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search products..."
                  className="pl-10 w-full sm:w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Dialog open={downloadDialogOpen} onOpenChange={setDownloadDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-transparent">
                    <Download className="w-4 h-4 mr-2" />
                    Download Products
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Download Products Report</DialogTitle>
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
                        onClick={handleDownloadProducts}
                        className="flex-1 bg-yellow-500 hover:bg-yellow-600"
                      >
                        Download CSV
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                if (!open) handleCloseAddDialog()
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-pink-500 hover:bg-pink-600 text-white text-sm" onClick={handleAddProductClick}>
                    <Plus className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Add Product</span>
                    <span className="sm:hidden">Add</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-md mx-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                    <div>
                      <Label htmlFor="product-name">Product Name *</Label>
                      <Input
                        id="product-name"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter product name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={newProduct.category}
                        onValueChange={(value) => setNewProduct((prev) => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Eggs">Eggs</SelectItem>
                          <SelectItem value="Chicks">Chicks</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price">Price (₱) *</Label>
                        <Input
                          id="price"
                          type="number"
                          value={newProduct.price}
                          onChange={(e) => setNewProduct((prev) => ({ ...prev, price: e.target.value }))}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="stock">Stock *</Label>
                        <Input
                          id="stock"
                          type="number"
                          value={newProduct.stock}
                          onChange={(e) => setNewProduct((prev) => ({ ...prev, stock: e.target.value }))}
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Images</Label>
                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={onDropAdd}
                        className="mt-2 border-2 border-dashed rounded-md p-6 text-center text-sm text-gray-500"
                      >
                        <p className="mb-2">Choose images or drag & drop here.</p>
                        <p className="mb-4">JPG, JPEG, PNG and WEBP. Max 20 MB.</p>
                        <label className="inline-block cursor-pointer bg-white border px-3 py-1 rounded-md">
                          Upload
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={async (e) => {
                              if (!e.target.files) return
                              // keep previews
                              onAddImages(e.target.files)
                              // also upload files immediately
                              const form = new FormData()
                              Array.from(e.target.files).forEach((f) => form.append('files', f))
                              try {
                                const up = await fetch('/api/uploads', { method: 'POST', body: form })
                                if (up.ok) {
                                  const data = await up.json()
                                  const urls = data.urls as string[]
                                  // Store uploaded URLs in component state
                                  setUploadedImageUrls(prev => [...prev, ...urls])
                                  console.log('Uploaded image URLs:', urls)
                                }
                              } catch (err) {
                                console.error('Upload failed:', err)
                              }
                            }}
                          />
                        </label>
                      </div>
                      {newImages.length > 0 && (
                        <div className="mt-3 grid grid-cols-4 gap-3">
                          {newImages.map((src, idx) => (
                            <div key={idx} className="relative">
                              <img src={src} alt="Preview" className="w-full h-20 object-cover rounded-md" />
                              <button
                                type="button"
                                onClick={() => removeNewImage(idx)}
                                className="absolute -top-2 -right-2 bg-white border rounded-full w-6 h-6 text-xs"
                                aria-label="Remove image"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          {Array.from({ length: Math.max(0, 4 - newImages.length) }).map((_, i) => (
                            <div key={`ph-${i}`} className="w-full h-20 bg-gray-50 border rounded-md" />
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newProduct.description}
                        onChange={(e) => setNewProduct((prev) => ({ ...prev, description: e.target.value }))}
                        placeholder="Product description..."
                        rows={3}
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button onClick={handleAddImages} className="flex-1 bg-pink-500 hover:bg-pink-600 text-white">
                        <Save className="w-4 h-4 mr-2" />
                        Add Product
                      </Button>
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {loading && <p className="text-sm text-gray-500">Loading products…</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="hidden sm:table-cell">Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image || "/placeholder.svg"}
                          alt={product.name}
                          className="w-8 h-8 sm:w-10 sm:h-10 object-cover rounded-lg"
                        />
                        <div>
                          <p className="font-medium text-gray-900 text-sm sm:text-base">{product.name}</p>
                          <p className="text-xs text-gray-500 sm:hidden">{product.category}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{product.category}</TableCell>
                    <TableCell className="text-sm sm:text-base">₱{product.price}</TableCell>
                    <TableCell className="text-sm sm:text-base">{product.stock}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge
                        variant={product.status === "Active" ? "default" : "destructive"}
                        className={
                          product.status === "Active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }
                      >
                        {product.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8"
                          onClick={() => handleViewProduct(product)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8"
                          onClick={() => handleEditClick(product)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-8 h-8 text-red-500 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="w-[95vw] max-w-md mx-auto">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Product</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{product.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                              <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteProduct(product.id)}
                                className="w-full sm:w-auto bg-red-500 hover:bg-red-600"
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
          </div>
        </CardContent>
      </Card>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="flex justify-center">
                <img
                  src={selectedProduct.image || "/placeholder.svg"}
                  alt={selectedProduct.name}
                  className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg"
                />
              </div>
              <div>
                <Label>Product Name</Label>
                <p className="text-sm text-gray-600">{selectedProduct.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <p className="text-sm text-gray-600">{selectedProduct.category}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge
                    variant={selectedProduct.status === "Active" ? "default" : "destructive"}
                    className={
                      selectedProduct.status === "Active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }
                  >
                    {selectedProduct.status}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Price</Label>
                  <p className="text-sm text-gray-600">₱{selectedProduct.price}</p>
                </div>
                <div>
                  <Label>Stock</Label>
                  <p className="text-sm text-gray-600">{selectedProduct.stock} units</p>
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <p className="text-sm text-gray-600">{selectedProduct.description || "No description available"}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-[95vw] max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <Label htmlFor="edit-product-name">Product Name *</Label>
                <Input
                  id="edit-product-name"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Category *</Label>
                <Select
                  value={editingProduct.category}
                  onValueChange={(value) => setEditingProduct((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Eggs">Eggs</SelectItem>
                    <SelectItem value="Chicks">Chicks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-price">Price (₱) *</Label>
                  <Input
                    id="edit-price"
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct((prev) => ({ ...prev, price: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-stock">Stock *</Label>
                  <Input
                    id="edit-stock"
                    type="number"
                    value={editingProduct.stock}
                    onChange={(e) => setEditingProduct((prev) => ({ ...prev, stock: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-image">Image URL</Label>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  className="mt-2 border-2 border-dashed rounded-md p-6 text-center text-sm text-gray-500"
                >
                  <p className="mb-2">Choose images or drag & drop here.</p>
                  <p className="mb-4">JPG, JPEG, PNG and WEBP. Max 20 MB.</p>
                  <label className="inline-block cursor-pointer bg-white border px-3 py-1 rounded-md">
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={async (e) => {
                        if (!e.target.files) return
                        const form = new FormData()
                        Array.from(e.target.files).forEach((f) => form.append('files', f))
                        try {
                          const up = await fetch('/api/uploads', { method: 'POST', body: form })
                          if (up.ok) {
                            const data = await up.json()
                            const urls = data.urls as string[]
                            ;(window as any).__uploadedEditImageUrls = [
                              ...(((window as any).__uploadedEditImageUrls as string[]) || []),
                              ...urls,
                            ]
                          }
                        } catch (err) {
                          // ignore
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Product description..."
                  rows={3}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={handleEditProduct} className="flex-1 bg-pink-500 hover:bg-pink-600 text-white">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
