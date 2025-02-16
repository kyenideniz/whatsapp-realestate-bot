// app/listings/[id]/ListingPageClient.tsx
"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Listing, ListingStatus } from "@/types"
import { Sidebar } from "@/components/ui/sidebar"

interface ListingPageClientProps {
  initialListing: Listing | null;
  isNew: boolean; // Now properly computed on server
}

export default function ListingPageClient({ 
  initialListing,
  isNew
}: ListingPageClientProps) {
  const router = useRouter();
  const [date, setDate] = useState<Date>(new Date());
  const [viewingTimes, setViewingTimes] = useState<Date[]>(
    initialListing?.viewingTimes?.map(t => new Date(t)) || []
  );

  useEffect(() => {
    if (!isNew && !initialListing) {
      router.push('/404');
    } else if (initialListing) {
      setDate(new Date(initialListing.date));
      setViewingTimes(initialListing.viewingTimes);
    }
  }, [initialListing, isNew, router]);

  async function handleSubmit(formData: FormData) {
    // Convert form data to match Listing type
    const listingData = {
      id: initialListing?.id || '',
      code: formData.get("code") as string,
      address: formData.get("address") as string,
      price: formData.get("price") as string,
      bedrooms: Number(formData.get("bedrooms")),
      bathrooms: Number(formData.get("bathrooms")),
      size: formData.get("size") as string,
      status: formData.get("status") as ListingStatus,
      date: date,
      viewingTimes: viewingTimes,
      description: formData.get("description") as string
    };

    // API call logic would go here
    router.push(`/properties/${listingData.id}`);
  }

  if (!isNew && !initialListing) return null;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl font-bold">
            {isNew ? "Add New Property" : "Edit Property"}
          </h2>
          <div className="flex items-center space-x-4">
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
            <CardTitle>Property Details</CardTitle>
            <CardDescription>
              {isNew ? "Enter" : "Edit"} the details of the property listing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="code">Property Code</Label>
                  <Input 
                    id="code" 
                    name="code"
                    placeholder="e.g., PROP-010" 
                    defaultValue={initialListing?.code || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input 
                    id="address" 
                    name="address"
                    placeholder="e.g., 345 Redwood Drive, Mountain View" 
                    defaultValue={initialListing?.address || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <Input 
                    id="price" 
                    name="price"
                    placeholder="e.g., $1,800,000" 
                    defaultValue={initialListing?.price || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input 
                    id="bedrooms" 
                    name="bedrooms"
                    type="number" 
                    placeholder="e.g., 6" 
                    defaultValue={initialListing?.bedrooms || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input 
                    id="bathrooms" 
                    name="bathrooms"
                    type="number" 
                    placeholder="e.g., 5" 
                    defaultValue={initialListing?.bathrooms || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size">Size (sqft)</Label>
                  <Input 
                    id="size" 
                    name="size"
                    placeholder="e.g., 4500" 
                    defaultValue={initialListing?.size || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    name="status" 
                    defaultValue={initialListing?.status || "For Sale"}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="For Sale">For Sale</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Sold">Sold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Listing Date</Label>
                  <input 
                    type="hidden" 
                    name="date" 
                    value={date?.toISOString() || initialListing?.date?.toString() || ""} 
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <div
                        className={cn(
                          "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                          "flex items-center justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Pick a date</span>}
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar 
                      mode="single" 
                      selected={date} 
                      onSelect={(day) => {
                        if (day) {
                          setDate(day);
                        } else {
                          setDate(new Date()); // or handle undefined case appropriately
                        }
                      }}
                      initialFocus 
                    />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Viewing Times</Label>
                <input 
                  type="hidden" 
                  name="viewingTimes" 
                  value={viewingTimes.map(t => t.toISOString())} 
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <div
                      className={cn(
                        "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                        "flex items-center justify-start text-left font-normal",
                        viewingTimes.length === 0 && "text-muted-foreground"
                      )}
                    >
                      {viewingTimes.length > 0 ? (
                        viewingTimes.map(date => 
                          format(date, 'MMM dd, h:mm a')
                        ).join(', ')
                      ) : (
                        <span>Select viewing times</span>
                      )}
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="multiple"
                      selected={viewingTimes}
                      onSelect={(days) => setViewingTimes(days || [])}
                      initialFocus
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  name="description"
                  placeholder="Enter property description" 
                  defaultValue={initialListing?.description || ""}
                />
              </div>
              <Button type="submit" className="w-full">
                {isNew ? "Add Property" : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}