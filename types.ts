// types/listing.d.ts
export type ListingStatus = "For Sale" | "Pending" | "Sold";

export interface Listing {
  id: string;
  code: string;
  address: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  size: string;
  status: ListingStatus;
  date: Date;
  viewingTimes: Date[];
  description?: string;
}