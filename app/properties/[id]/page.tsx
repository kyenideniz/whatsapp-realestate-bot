// app/properties/[id]/page.tsx
import ListingPageClient from '@/components/listingPageClient';
import { Listing, ListingStatus } from '@/types';
import { listings } from '@/config/listings';

async function getListing(id: string): Promise<Listing | null> {
  // Artificial delay for demonstration (remove in production)
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  if (id === "new") return null;
  
  const rawListing = listings.find(listing => listing.id === id);
  if (!rawListing) return null;

  return {
    ...rawListing,
    status: rawListing.status as ListingStatus,
    date: new Date(rawListing.date),
    viewingTimes: rawListing.viewing_times.map(t => new Date(t)),
    description: rawListing.description
  };
}

export default async function Page({ params } : {params: Promise<Listing> }) {
  const { id } = await params;
  const listing = await getListing(id); // Loading shows during this await
  const isNew = id === "new";

  return (
    <ListingPageClient 
      initialListing={listing}
      isNew={isNew}
    />
  );
}

// Add generateStaticParams for SSG
export async function generateStaticParams() {
  return [
    { id: "new" },
    ...listings.map(listing => ({ id: listing.id }))
  ];
}