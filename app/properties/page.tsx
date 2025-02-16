"use client"

import { useState } from 'react';
import { Menu, Plus, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { listings } from "@/config/listings"
import { Sidebar } from '@/components/ui/sidebar';

const getBadgeVariant = (status: string) => {
  switch (status) {
    case 'For Sale': return 'default';
    case 'Pending': return 'secondary';
    case 'Sold': return 'destructive';
    default: return 'outline';
  }
};

export default function PropertiesPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('');

  const parsePrice = (priceString: string) => {
    return parseFloat(priceString.replace(/[^0-9.]/g, ''));
  };

  const filteredListings = listings
    .filter(property => {
      const matchesStatus = statusFilter === 'all' || 
        property.status.toLowerCase() === statusFilter.replace('-', ' ');
      
      const searchLower = searchQuery.toLowerCase();
      const propertyString = [
        property.code,
        property.address,
        property.price,
        property.bedrooms.toString(),
        property.bathrooms.toString(),
        property.size,
        property.status
      ].join(' ').toLowerCase();
      
      const matchesSearch = propertyString.includes(searchLower);
      
      return matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return parsePrice(a.price) - parsePrice(b.price);
        case 'price-desc':
          return parsePrice(b.price) - parsePrice(a.price);
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        default:
          return 0;
      }
    });

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl font-bold">Properties</h2>
          <div className="flex items-center space-x-4">
            <Input 
              type="search" 
              placeholder="Search properties..." 
              className="w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Property
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Property Listings</CardTitle>
            <CardDescription>Manage and view all your property listings.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex space-x-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Properties</SelectItem>
                    <SelectItem value="for-sale">For Sale</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price-asc">Price: Low to High</SelectItem>
                    <SelectItem value="price-desc">Price: High to Low</SelectItem>
                    <SelectItem value="date-asc">Date: Oldest First</SelectItem>
                    <SelectItem value="date-desc">Date: Newest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                More Filters
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Bed</TableHead>
                  <TableHead>Bath</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Listed Date</TableHead>
                  <TableHead className="text-right">Viewing Times</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredListings.map((property) => (
                  <TableRow key={property.code}>
                    <TableCell className="font-medium">{property.code}</TableCell>
                    <TableCell>{property.address}</TableCell>
                    <TableCell>{property.price}</TableCell>
                    <TableCell>{property.bedrooms}</TableCell>
                    <TableCell>{property.bathrooms}</TableCell>
                    <TableCell>{property.size}</TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(property.status)}>
                        {property.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(property.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            View Times
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          {property.viewing_times.map((time, idx) => (
                            <DropdownMenuItem key={idx}>
                              {new Date(time).toLocaleString()}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {filteredListings.length} of {listings.length} properties
              </p>
              <div className="space-x-2">
                <Button variant="outline" size="sm">
                  Previous
                </Button>
                <Button variant="outline" size="sm">
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}