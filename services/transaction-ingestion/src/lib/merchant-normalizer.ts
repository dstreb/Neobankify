/**
 * Merchant Name Normalization Engine
 *
 * Cleans and normalizes raw merchant names from card networks and Plaid
 * to produce consistent, human-readable merchant identifiers.
 *
 * Handles:
 * - Location suffixes (city, state, zip)
 * - Store numbers and branch IDs
 * - Common abbreviations and prefixes
 * - Payment processor prefixes (SQ *, TST *, etc.)
 * - Unicode and special character cleanup
 * - Known merchant alias resolution
 */

/**
 * Well-known merchant aliases mapping raw patterns to canonical names.
 * These are the most common merchants that appear with many variations.
 */
const MERCHANT_ALIASES: Array<{ pattern: RegExp; canonical: string; category?: string }> = [
  // Major retailers
  { pattern: /\bWAL[\s-]?MART\b/i, canonical: 'WALMART', category: 'groceries' },
  { pattern: /\bSAMS\s*CLUB\b/i, canonical: "SAM'S CLUB", category: 'groceries' },
  { pattern: /\bCOSTCO\b/i, canonical: 'COSTCO', category: 'groceries' },
  { pattern: /\bTARGET\b/i, canonical: 'TARGET', category: 'shopping' },
  { pattern: /\bAMAZON\b/i, canonical: 'AMAZON', category: 'shopping' },
  { pattern: /\bAMZN\b/i, canonical: 'AMAZON', category: 'shopping' },
  { pattern: /\bWHOLE\s*FOODS\b/i, canonical: 'WHOLE FOODS', category: 'groceries' },
  { pattern: /\bTRADER\s*JOE/i, canonical: "TRADER JOE'S", category: 'groceries' },
  { pattern: /\bALDI\b/i, canonical: 'ALDI', category: 'groceries' },
  { pattern: /\bKROGER\b/i, canonical: 'KROGER', category: 'groceries' },
  { pattern: /\bPUBLIX\b/i, canonical: 'PUBLIX', category: 'groceries' },
  { pattern: /\bSAFEWAY\b/i, canonical: 'SAFEWAY', category: 'groceries' },
  { pattern: /\bALBERTSON/i, canonical: 'ALBERTSONS', category: 'groceries' },
  { pattern: /\bHOME\s*DEPOT\b/i, canonical: 'HOME DEPOT', category: 'home_improvement' },
  { pattern: /\bLOWE['']?S\b/i, canonical: "LOWE'S", category: 'home_improvement' },
  { pattern: /\bBEST\s*BUY\b/i, canonical: 'BEST BUY', category: 'shopping' },
  { pattern: /\bAPPLE[\s.]COM\b/i, canonical: 'APPLE', category: 'subscriptions' },
  { pattern: /\bGOOGLE\s*\*\s*/i, canonical: 'GOOGLE', category: 'subscriptions' },

  // Fast food & dining
  { pattern: /\bMCDONALD/i, canonical: "MCDONALD'S", category: 'dining' },
  { pattern: /\bSTARBUCKS\b/i, canonical: 'STARBUCKS', category: 'dining' },
  { pattern: /\bCHICK[\s-]?FIL[\s-]?A\b/i, canonical: 'CHICK-FIL-A', category: 'dining' },
  { pattern: /\bCHIPOTLE\b/i, canonical: 'CHIPOTLE', category: 'dining' },
  { pattern: /\bSUBWAY\b/i, canonical: 'SUBWAY', category: 'dining' },
  { pattern: /\bDOMINO/i, canonical: "DOMINO'S", category: 'dining' },
  { pattern: /\bPANERA\b/i, canonical: 'PANERA BREAD', category: 'dining' },
  { pattern: /\bDUNKIN/i, canonical: "DUNKIN'", category: 'dining' },
  { pattern: /\bWENDY/i, canonical: "WENDY'S", category: 'dining' },
  { pattern: /\bBURGER\s*KING\b/i, canonical: 'BURGER KING', category: 'dining' },
  { pattern: /\bTACO\s*BELL\b/i, canonical: 'TACO BELL', category: 'dining' },
  { pattern: /\bPIZZA\s*HUT\b/i, canonical: 'PIZZA HUT', category: 'dining' },

  // Gas stations
  { pattern: /\bSHELL\b/i, canonical: 'SHELL', category: 'gas' },
  { pattern: /\bCHEVRON\b/i, canonical: 'CHEVRON', category: 'gas' },
  { pattern: /\bEXXON\b/i, canonical: 'EXXON', category: 'gas' },
  { pattern: /\bMOBIL\b/i, canonical: 'MOBIL', category: 'gas' },
  { pattern: /\bBP\b/, canonical: 'BP', category: 'gas' },
  { pattern: /\bSPEEDWAY\b/i, canonical: 'SPEEDWAY', category: 'gas' },
  { pattern: /\bWAWA\b/i, canonical: 'WAWA', category: 'gas' },
  { pattern: /\bSHEETZ\b/i, canonical: 'SHEETZ', category: 'gas' },
  { pattern: /\bQUIK\s*TRIP\b/i, canonical: 'QUIKTRIP', category: 'gas' },
  { pattern: /\b7[\s-]?ELEVEN\b/i, canonical: '7-ELEVEN', category: 'gas' },

  // Subscriptions & streaming
  { pattern: /\bNETFLIX\b/i, canonical: 'NETFLIX', category: 'subscriptions' },
  { pattern: /\bSPOTIFY\b/i, canonical: 'SPOTIFY', category: 'subscriptions' },
  { pattern: /\bHULU\b/i, canonical: 'HULU', category: 'subscriptions' },
  { pattern: /\bDISNEY\s*\+/i, canonical: 'DISNEY+', category: 'subscriptions' },
  { pattern: /\bHBO\s*MAX\b/i, canonical: 'HBO MAX', category: 'subscriptions' },
  { pattern: /\bYOUTUBE\b/i, canonical: 'YOUTUBE', category: 'subscriptions' },
  { pattern: /\bAPPLE\s*TV/i, canonical: 'APPLE TV+', category: 'subscriptions' },
  { pattern: /\bAMAZON\s*PRIME\b/i, canonical: 'AMAZON PRIME', category: 'subscriptions' },

  // Rideshare & transportation
  { pattern: /\bUBER\s*EATS\b/i, canonical: 'UBER EATS', category: 'dining' },
  { pattern: /\bUBER\b/i, canonical: 'UBER', category: 'transportation' },
  { pattern: /\bLYFT\b/i, canonical: 'LYFT', category: 'transportation' },
  { pattern: /\bDOORDASH\b/i, canonical: 'DOORDASH', category: 'dining' },
  { pattern: /\bGRUBHUB\b/i, canonical: 'GRUBHUB', category: 'dining' },
  { pattern: /\bINSTACART\b/i, canonical: 'INSTACART', category: 'groceries' },

  // Pharmacies
  { pattern: /\bCVS\b/i, canonical: 'CVS', category: 'health' },
  { pattern: /\bWALGREEN/i, canonical: 'WALGREENS', category: 'health' },
  { pattern: /\bRITE[\s-]?AID\b/i, canonical: 'RITE AID', category: 'health' },
];

/**
 * Payment processor prefixes to strip.
 */
const PROCESSOR_PREFIXES = [
  /^SQ\s*\*\s*/i,         // Square
  /^TST\s*\*\s*/i,        // Toast
  /^PAYPAL\s*\*\s*/i,     // PayPal
  /^VENMO\s*\*\s*/i,      // Venmo
  /^ZELLE\s*\*\s*/i,      // Zelle
  /^STRIPE\s*\*\s*/i,     // Stripe
  /^CKE\s*\*\s*/i,        // CardKnox
  /^SP\s*\*\s*/i,         // Shopify
  /^WPY\s*\*\s*/i,        // WePay
  /^CLOVER\s*\*\s*/i,     // Clover
  /^DBA\s*\*\s*/i,        // Doing Business As
  /^IN\s*\*\s*/i,         // Invoice
  /^PP\s*\*\s*/i,         // PayPal (alt)
];

/**
 * Suffixes to strip from merchant names.
 */
const SUFFIX_PATTERNS = [
  /\s*#\s*\d+\s*$/,                       // Store number: #1234
  /\s*STORE\s*#?\s*\d+\s*$/i,              // STORE 1234
  /\s*LOCATION\s*#?\s*\d+\s*$/i,           // LOCATION 1234
  /\s*UNIT\s*#?\s*\d+\s*$/i,               // UNIT 1234
  /\s*STR\s*#?\s*\d+\s*$/i,                // STR 1234
  /\s*BR\s*#?\s*\d+\s*$/i,                 // Branch: BR 1234
  /\s+\d{5}(-\d{4})?\s*$/,                 // ZIP code: 90210 or 90210-1234
  /\s+[A-Z]{2}\s+\d{5}(-\d{4})?\s*$/,     // State + ZIP: CA 90210
  /\s+[A-Z]{2}\s*$/,                       // Trailing state code: CA
  /\s*\d{3}[-.]?\d{3}[-.]?\d{4}\s*$/,     // Phone number
  /\s*\(\d{3}\)\s*\d{3}[-.]?\d{4}\s*$/,   // Phone: (800) 123-4567
  /\s*WWW\.[A-Z0-9.-]+\.[A-Z]{2,}\s*$/i,  // Website
  /\s*HTTP[S]?:\/\/[^\s]+\s*$/i,           // URL
];

export interface NormalizationResult {
  normalized: string;
  canonical: string | null;
  suggestedCategory: string | null;
  confidence: number;
  aliasMatched: boolean;
}

/**
 * Normalize a raw merchant name.
 *
 * Steps:
 * 1. Trim and uppercase
 * 2. Strip payment processor prefixes
 * 3. Strip location/store suffixes
 * 4. Clean special characters
 * 5. Match against known merchant aliases
 * 6. Apply final cleanup
 */
export function normalizeMerchant(rawName: string): NormalizationResult {
  if (!rawName || rawName.trim().length === 0) {
    return {
      normalized: 'UNKNOWN',
      canonical: null,
      suggestedCategory: null,
      confidence: 0,
      aliasMatched: false,
    };
  }

  let name = rawName.trim().toUpperCase();

  // Step 1: Strip payment processor prefixes
  for (const prefix of PROCESSOR_PREFIXES) {
    name = name.replace(prefix, '');
  }

  // Step 2: Strip suffixes (location, store numbers, zip codes)
  for (const suffix of SUFFIX_PATTERNS) {
    name = name.replace(suffix, '');
  }

  // Step 3: Clean special characters
  name = name
    .replace(/[^\w\s&'.-]/g, ' ')  // Keep alphanumeric, spaces, &, ', ., -
    .replace(/\s+/g, ' ')           // Collapse multiple spaces
    .trim();

  // Step 4: Match against known merchant aliases
  for (const alias of MERCHANT_ALIASES) {
    if (alias.pattern.test(name) || alias.pattern.test(rawName)) {
      return {
        normalized: name,
        canonical: alias.canonical,
        suggestedCategory: alias.category || null,
        confidence: 0.95,
        aliasMatched: true,
      };
    }
  }

  // Step 5: Final cleanup — remove trailing single characters
  name = name.replace(/\s+[A-Z]$/, '');

  // Calculate confidence based on cleanup quality
  let confidence = 0.5;
  if (name.length > 3) confidence += 0.15;
  if (name.length < 50) confidence += 0.1;
  if (name !== rawName.trim().toUpperCase()) confidence += 0.1; // We cleaned something
  confidence = Math.min(confidence, 0.85);

  return {
    normalized: name,
    canonical: null,
    suggestedCategory: null,
    confidence,
    aliasMatched: false,
  };
}

/**
 * Batch normalize an array of merchant names.
 */
export function batchNormalize(
  merchantNames: string[],
): NormalizationResult[] {
  return merchantNames.map(normalizeMerchant);
}
