import { distance } from 'fastest-levenshtein';
import { listings } from '@/config/listings';

export function findMatchingProperty(userInput) {
  const cleanInput = userInput
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim();

  // Exact matches
  const exactMatch = listings.find(listing => 
    listing.code.toLowerCase() === cleanInput ||
    listing.address.toLowerCase().includes(cleanInput)
  );
  if (exactMatch) return exactMatch;

  // Fuzzy matching with search terms
  const matches = listings.map(listing => ({
    listing,
    score: Math.min(
      ...listing.searchTerms.map(term => 
        distance(cleanInput, term.toLowerCase())
      ))
    })
  ).sort((a, b) => a.score - b.score);

  // Threshold for acceptable matches
  if (matches[0].score <= 2) {
    return matches[0].listing;
  }

  // Partial address matching
  const addressMatch = listings.find(listing => 
    listing.address.toLowerCase().includes(cleanInput)
  );
  
  return addressMatch || null;
}