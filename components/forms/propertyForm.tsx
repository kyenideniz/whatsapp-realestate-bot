"use client"

import { Controller, useForm } from "react-hook-form"
import { Listing } from "@/types"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface PropertyFormProps {
  initialData?: Partial<Listing>  // Allow partial data
  onSubmit: (data: Listing) => Promise<void>
}

export function PropertyForm({ initialData, onSubmit }: PropertyFormProps) {
  const { control, handleSubmit } = useForm<Listing>({
    defaultValues: {
      // Transform snake_case to camelCase and provide defaults
      id: initialData?.id || "",
      code: initialData?.code || "",
      address: initialData?.address || "",
      price: initialData?.price || "",
      bedrooms: initialData?.bedrooms || 0,
      bathrooms: initialData?.bathrooms || 0,
      size: initialData?.size || "",
      status: initialData?.status || "For Sale",
      date: initialData?.date ? new Date(initialData.date) : new Date(),
      viewingTimes: initialData?.viewingTimes?.map(t => new Date(t)) || [], // Correct property name
      description: initialData?.description || ""
    }
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Controller
        name="code"
        control={control}
        render={({ field }) => (
          <div className="space-y-2">
            <Label>Property Code</Label>
            <Input {...field} placeholder="PROP-001" />
          </div>
        )}
      />
      {/* Add other fields similarly */}
    </form>
  )
}