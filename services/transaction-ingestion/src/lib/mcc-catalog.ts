/**
 * Comprehensive MCC Code Catalog
 *
 * Maps Merchant Category Codes (MCC) to spending categories and subcategories.
 * Covers 200+ common MCC codes organized by major category.
 *
 * Sources: ISO 18245, Visa/Mastercard merchant classification
 */

export interface MCCEntry {
  category: string;
  subcategory: string;
  description: string;
  rewardEligible: boolean;
}

/**
 * Full MCC code catalog. Each entry maps an MCC code to a category,
 * subcategory, human description, and reward eligibility flag.
 */
export const MCC_CATALOG: Record<string, MCCEntry> = {
  // =====================================================
  // DINING & RESTAURANTS
  // =====================================================
  '5811': { category: 'dining', subcategory: 'caterers', description: 'Caterers', rewardEligible: true },
  '5812': { category: 'dining', subcategory: 'restaurants', description: 'Eating Places & Restaurants', rewardEligible: true },
  '5813': { category: 'dining', subcategory: 'bars_lounges', description: 'Bars, Cocktail Lounges, Taverns', rewardEligible: true },
  '5814': { category: 'dining', subcategory: 'fast_food', description: 'Fast Food Restaurants', rewardEligible: true },

  // =====================================================
  // GROCERIES
  // =====================================================
  '5411': { category: 'groceries', subcategory: 'supermarkets', description: 'Grocery Stores & Supermarkets', rewardEligible: true },
  '5422': { category: 'groceries', subcategory: 'meat_markets', description: 'Freezer & Locker Meat Provisioners', rewardEligible: true },
  '5441': { category: 'groceries', subcategory: 'candy_stores', description: 'Candy, Nut & Confectionery Stores', rewardEligible: true },
  '5451': { category: 'groceries', subcategory: 'dairy_stores', description: 'Dairy Products Stores', rewardEligible: true },
  '5462': { category: 'groceries', subcategory: 'bakeries', description: 'Bakeries', rewardEligible: true },
  '5499': { category: 'groceries', subcategory: 'specialty_food', description: 'Miscellaneous Food Stores', rewardEligible: true },

  // =====================================================
  // GAS & FUEL
  // =====================================================
  '5541': { category: 'gas', subcategory: 'gas_stations', description: 'Service Stations (Gas)', rewardEligible: true },
  '5542': { category: 'gas', subcategory: 'automated_fuel', description: 'Automated Fuel Dispensers', rewardEligible: true },
  '5983': { category: 'gas', subcategory: 'fuel_dealers', description: 'Fuel Dealers (Non-Automotive)', rewardEligible: true },

  // =====================================================
  // TRAVEL — AIRLINES
  // =====================================================
  '3000': { category: 'travel', subcategory: 'airlines', description: 'United Airlines', rewardEligible: true },
  '3001': { category: 'travel', subcategory: 'airlines', description: 'American Airlines', rewardEligible: true },
  '3005': { category: 'travel', subcategory: 'airlines', description: 'British Airways', rewardEligible: true },
  '3007': { category: 'travel', subcategory: 'airlines', description: 'Air France', rewardEligible: true },
  '3026': { category: 'travel', subcategory: 'airlines', description: 'Hawaiian Airlines', rewardEligible: true },
  '3058': { category: 'travel', subcategory: 'airlines', description: 'Delta Air Lines', rewardEligible: true },
  '3061': { category: 'travel', subcategory: 'airlines', description: 'Southwest Airlines', rewardEligible: true },
  '3066': { category: 'travel', subcategory: 'airlines', description: 'Alaska Airlines', rewardEligible: true },
  '3082': { category: 'travel', subcategory: 'airlines', description: 'Korean Air', rewardEligible: true },
  '3174': { category: 'travel', subcategory: 'airlines', description: 'JetBlue Airways', rewardEligible: true },
  '3261': { category: 'travel', subcategory: 'airlines', description: 'Spirit Airlines', rewardEligible: true },
  '4511': { category: 'travel', subcategory: 'airlines', description: 'Airlines & Air Carriers', rewardEligible: true },

  // =====================================================
  // TRAVEL — HOTELS & LODGING
  // =====================================================
  '3501': { category: 'travel', subcategory: 'hotels', description: 'Hilton Hotels', rewardEligible: true },
  '3502': { category: 'travel', subcategory: 'hotels', description: 'Sheraton Hotels', rewardEligible: true },
  '3504': { category: 'travel', subcategory: 'hotels', description: 'Marriott Hotels', rewardEligible: true },
  '3509': { category: 'travel', subcategory: 'hotels', description: 'Best Western Hotels', rewardEligible: true },
  '3512': { category: 'travel', subcategory: 'hotels', description: 'InterContinental Hotels', rewardEligible: true },
  '3527': { category: 'travel', subcategory: 'hotels', description: 'Hyatt Hotels', rewardEligible: true },
  '3542': { category: 'travel', subcategory: 'hotels', description: 'Club Med', rewardEligible: true },
  '7011': { category: 'travel', subcategory: 'hotels', description: 'Hotels, Motels & Resorts', rewardEligible: true },
  '7012': { category: 'travel', subcategory: 'timeshares', description: 'Timeshares', rewardEligible: true },
  '7033': { category: 'travel', subcategory: 'camping', description: 'Campgrounds & RV Parks', rewardEligible: true },

  // =====================================================
  // TRAVEL — CAR RENTAL
  // =====================================================
  '3351': { category: 'travel', subcategory: 'car_rental', description: 'Hertz', rewardEligible: true },
  '3352': { category: 'travel', subcategory: 'car_rental', description: 'Avis', rewardEligible: true },
  '3355': { category: 'travel', subcategory: 'car_rental', description: 'Budget', rewardEligible: true },
  '3357': { category: 'travel', subcategory: 'car_rental', description: 'National', rewardEligible: true },
  '3366': { category: 'travel', subcategory: 'car_rental', description: 'Enterprise', rewardEligible: true },
  '7512': { category: 'travel', subcategory: 'car_rental', description: 'Car Rental Agencies', rewardEligible: true },

  // =====================================================
  // TRAVEL — OTHER
  // =====================================================
  '4722': { category: 'travel', subcategory: 'travel_agencies', description: 'Travel Agencies & Tour Operators', rewardEligible: true },
  '4411': { category: 'travel', subcategory: 'cruise_lines', description: 'Cruise Lines', rewardEligible: true },
  '4112': { category: 'travel', subcategory: 'passenger_railways', description: 'Passenger Railways', rewardEligible: true },
  '4131': { category: 'travel', subcategory: 'bus_lines', description: 'Bus Lines', rewardEligible: true },
  '7523': { category: 'travel', subcategory: 'parking', description: 'Parking Lots & Garages', rewardEligible: true },

  // =====================================================
  // TRANSPORTATION
  // =====================================================
  '4111': { category: 'transportation', subcategory: 'local_transit', description: 'Local & Suburban Transit', rewardEligible: true },
  '4121': { category: 'transportation', subcategory: 'rideshare', description: 'Taxicabs & Rideshares', rewardEligible: true },
  '4789': { category: 'transportation', subcategory: 'other_transport', description: 'Transportation Services', rewardEligible: true },
  '7519': { category: 'transportation', subcategory: 'vehicle_rental', description: 'Motor Home & RV Rentals', rewardEligible: true },

  // =====================================================
  // ENTERTAINMENT
  // =====================================================
  '7832': { category: 'entertainment', subcategory: 'movies', description: 'Motion Picture Theaters', rewardEligible: true },
  '7841': { category: 'entertainment', subcategory: 'video_rental', description: 'Video & DVD Rental', rewardEligible: true },
  '7911': { category: 'entertainment', subcategory: 'dance_halls', description: 'Dance Halls & Studios', rewardEligible: true },
  '7922': { category: 'entertainment', subcategory: 'events', description: 'Theatrical Producers & Ticket Agencies', rewardEligible: true },
  '7929': { category: 'entertainment', subcategory: 'performers', description: 'Bands, Orchestras & Entertainment', rewardEligible: true },
  '7932': { category: 'entertainment', subcategory: 'billiards', description: 'Billiard & Pool Establishments', rewardEligible: true },
  '7933': { category: 'entertainment', subcategory: 'bowling', description: 'Bowling Alleys', rewardEligible: true },
  '7941': { category: 'entertainment', subcategory: 'sports', description: 'Sports Clubs & Stadiums', rewardEligible: true },
  '7991': { category: 'entertainment', subcategory: 'tourist', description: 'Tourist Attractions & Exhibits', rewardEligible: true },
  '7993': { category: 'entertainment', subcategory: 'gaming', description: 'Video Amusement Game Supplies', rewardEligible: true },
  '7994': { category: 'entertainment', subcategory: 'arcade', description: 'Video Game Arcades', rewardEligible: true },
  '7996': { category: 'entertainment', subcategory: 'amusement_parks', description: 'Amusement Parks & Circuses', rewardEligible: true },
  '7997': { category: 'entertainment', subcategory: 'clubs', description: 'Country Clubs & Membership Clubs', rewardEligible: true },
  '7998': { category: 'entertainment', subcategory: 'aquariums', description: 'Aquariums & Zoos', rewardEligible: true },
  '7999': { category: 'entertainment', subcategory: 'recreation', description: 'Recreation Services', rewardEligible: true },

  // =====================================================
  // SUBSCRIPTIONS & DIGITAL
  // =====================================================
  '5815': { category: 'subscriptions', subcategory: 'digital_goods', description: 'Digital Goods: Media & Books', rewardEligible: true },
  '5816': { category: 'subscriptions', subcategory: 'digital_games', description: 'Digital Goods: Games', rewardEligible: true },
  '5817': { category: 'subscriptions', subcategory: 'software', description: 'Digital Goods: Applications', rewardEligible: true },
  '5818': { category: 'subscriptions', subcategory: 'streaming', description: 'Digital Goods: Large Volume', rewardEligible: true },
  '4899': { category: 'subscriptions', subcategory: 'cable_satellite', description: 'Cable, Satellite & Pay TV', rewardEligible: true },

  // =====================================================
  // UTILITIES
  // =====================================================
  '4900': { category: 'utilities', subcategory: 'utilities', description: 'Utilities: Electric, Gas, Water, Sanitary', rewardEligible: true },
  '4812': { category: 'utilities', subcategory: 'telecom', description: 'Telecommunication Equipment', rewardEligible: true },
  '4813': { category: 'utilities', subcategory: 'telecom', description: 'Key-entry Telecom Merchant', rewardEligible: true },
  '4814': { category: 'utilities', subcategory: 'telecom', description: 'Telecommunication Services', rewardEligible: true },
  '4816': { category: 'utilities', subcategory: 'internet', description: 'Computer Network Services', rewardEligible: true },
  '4821': { category: 'utilities', subcategory: 'telegraph', description: 'Telegraph Services', rewardEligible: true },

  // =====================================================
  // SHOPPING — GENERAL
  // =====================================================
  '5200': { category: 'shopping', subcategory: 'home_supply', description: 'Home Supply Warehouses', rewardEligible: true },
  '5211': { category: 'shopping', subcategory: 'lumber', description: 'Lumber & Building Materials', rewardEligible: true },
  '5251': { category: 'shopping', subcategory: 'hardware', description: 'Hardware Stores', rewardEligible: true },
  '5261': { category: 'shopping', subcategory: 'nurseries', description: 'Nurseries & Garden Supply', rewardEligible: true },
  '5300': { category: 'shopping', subcategory: 'wholesale', description: 'Wholesale Clubs', rewardEligible: true },
  '5310': { category: 'shopping', subcategory: 'discount', description: 'Discount Stores', rewardEligible: true },
  '5311': { category: 'shopping', subcategory: 'department', description: 'Department Stores', rewardEligible: true },
  '5331': { category: 'shopping', subcategory: 'variety', description: 'Variety Stores', rewardEligible: true },
  '5399': { category: 'shopping', subcategory: 'general_merch', description: 'General Merchandise', rewardEligible: true },

  // =====================================================
  // SHOPPING — CLOTHING & APPAREL
  // =====================================================
  '5611': { category: 'shopping', subcategory: 'mens_clothing', description: "Men's Clothing Stores", rewardEligible: true },
  '5621': { category: 'shopping', subcategory: 'womens_clothing', description: "Women's Clothing Stores", rewardEligible: true },
  '5631': { category: 'shopping', subcategory: 'womens_accessories', description: "Women's Accessory Stores", rewardEligible: true },
  '5641': { category: 'shopping', subcategory: 'childrens_clothing', description: "Children's Clothing Stores", rewardEligible: true },
  '5651': { category: 'shopping', subcategory: 'family_clothing', description: 'Family Clothing Stores', rewardEligible: true },
  '5661': { category: 'shopping', subcategory: 'shoe_stores', description: 'Shoe Stores', rewardEligible: true },
  '5691': { category: 'shopping', subcategory: 'clothing', description: 'Clothing Stores', rewardEligible: true },
  '5699': { category: 'shopping', subcategory: 'misc_apparel', description: 'Miscellaneous Apparel', rewardEligible: true },

  // =====================================================
  // SHOPPING — ELECTRONICS & HOME
  // =====================================================
  '5722': { category: 'shopping', subcategory: 'appliances', description: 'Household Appliance Stores', rewardEligible: true },
  '5732': { category: 'shopping', subcategory: 'electronics', description: 'Electronics Stores', rewardEligible: true },
  '5733': { category: 'shopping', subcategory: 'music_stores', description: 'Music Stores', rewardEligible: true },
  '5734': { category: 'shopping', subcategory: 'computers', description: 'Computer Software Stores', rewardEligible: true },
  '5735': { category: 'shopping', subcategory: 'records', description: 'Record Stores', rewardEligible: true },
  '5712': { category: 'shopping', subcategory: 'furniture', description: 'Furniture & Home Furnishings', rewardEligible: true },
  '5713': { category: 'shopping', subcategory: 'floor_covering', description: 'Floor Covering Stores', rewardEligible: true },
  '5714': { category: 'shopping', subcategory: 'drapery', description: 'Drapery, Upholstery & Window Covering', rewardEligible: true },
  '5719': { category: 'shopping', subcategory: 'misc_home', description: 'Miscellaneous Home Furnishing', rewardEligible: true },

  // =====================================================
  // SHOPPING — OTHER
  // =====================================================
  '5912': { category: 'shopping', subcategory: 'drug_stores', description: 'Drug Stores & Pharmacies', rewardEligible: true },
  '5921': { category: 'shopping', subcategory: 'package_stores', description: 'Package Stores (Liquor)', rewardEligible: true },
  '5941': { category: 'shopping', subcategory: 'sporting_goods', description: 'Sporting Goods Stores', rewardEligible: true },
  '5942': { category: 'shopping', subcategory: 'book_stores', description: 'Book Stores', rewardEligible: true },
  '5943': { category: 'shopping', subcategory: 'stationery', description: 'Stationery & Office Supply', rewardEligible: true },
  '5944': { category: 'shopping', subcategory: 'jewelry', description: 'Jewelry, Watch & Clock Stores', rewardEligible: true },
  '5945': { category: 'shopping', subcategory: 'hobby', description: 'Hobby, Toy & Game Stores', rewardEligible: true },
  '5946': { category: 'shopping', subcategory: 'camera', description: 'Camera & Photographic Supply', rewardEligible: true },
  '5947': { category: 'shopping', subcategory: 'gifts', description: 'Gift, Card & Novelty Stores', rewardEligible: true },
  '5948': { category: 'shopping', subcategory: 'luggage', description: 'Luggage & Leather Goods', rewardEligible: true },
  '5949': { category: 'shopping', subcategory: 'sewing', description: 'Sewing & Needlework Stores', rewardEligible: true },
  '5950': { category: 'shopping', subcategory: 'glassware', description: 'Glassware & Crystal Stores', rewardEligible: true },
  '5970': { category: 'shopping', subcategory: 'art', description: 'Artist Supply & Craft Stores', rewardEligible: true },
  '5971': { category: 'shopping', subcategory: 'art_dealers', description: 'Art Dealers & Galleries', rewardEligible: true },
  '5972': { category: 'shopping', subcategory: 'stamps', description: 'Stamp & Coin Stores', rewardEligible: true },
  '5977': { category: 'shopping', subcategory: 'cosmetics', description: 'Cosmetic Stores', rewardEligible: true },
  '5992': { category: 'shopping', subcategory: 'florists', description: 'Florists', rewardEligible: true },
  '5993': { category: 'shopping', subcategory: 'tobacco', description: 'Cigar Stores & Tobacconists', rewardEligible: true },
  '5994': { category: 'shopping', subcategory: 'news', description: 'News Dealers & Newsstands', rewardEligible: true },
  '5995': { category: 'shopping', subcategory: 'pet_stores', description: 'Pet Shops & Supplies', rewardEligible: true },
  '5999': { category: 'shopping', subcategory: 'misc_retail', description: 'Miscellaneous & Specialty Retail', rewardEligible: true },

  // =====================================================
  // ONLINE SHOPPING
  // =====================================================
  '5262': { category: 'shopping', subcategory: 'online_marketplace', description: 'Online Marketplaces', rewardEligible: true },
  '5964': { category: 'shopping', subcategory: 'catalog', description: 'Direct Marketing: Catalog & Catalog Merchants', rewardEligible: true },
  '5965': { category: 'shopping', subcategory: 'catalog', description: 'Direct Marketing: Combination Catalog/Retail', rewardEligible: true },
  '5966': { category: 'shopping', subcategory: 'outbound_telemarket', description: 'Direct Marketing: Outbound Telemarketing', rewardEligible: true },
  '5967': { category: 'shopping', subcategory: 'inbound_telemarket', description: 'Direct Marketing: Inbound Teleservices', rewardEligible: true },
  '5968': { category: 'shopping', subcategory: 'continuity_merch', description: 'Direct Marketing: Subscription Merchants', rewardEligible: true },
  '5969': { category: 'shopping', subcategory: 'other_direct', description: 'Direct Marketing: Other', rewardEligible: true },

  // =====================================================
  // HEALTH & MEDICAL
  // =====================================================
  '4119': { category: 'health', subcategory: 'ambulance', description: 'Ambulance Services', rewardEligible: true },
  '5047': { category: 'health', subcategory: 'medical_equipment', description: 'Medical & Dental Equipment', rewardEligible: true },
  '5975': { category: 'health', subcategory: 'hearing_aids', description: 'Hearing Aids', rewardEligible: true },
  '5976': { category: 'health', subcategory: 'orthopedic', description: 'Orthopedic Goods & Prosthetics', rewardEligible: true },
  '7298': { category: 'health', subcategory: 'spa', description: 'Health & Beauty Spas', rewardEligible: true },
  '8011': { category: 'health', subcategory: 'doctors', description: 'Doctors & Physicians', rewardEligible: true },
  '8021': { category: 'health', subcategory: 'dentists', description: 'Dentists & Orthodontists', rewardEligible: true },
  '8031': { category: 'health', subcategory: 'osteopaths', description: 'Osteopathic Physicians', rewardEligible: true },
  '8041': { category: 'health', subcategory: 'chiropractors', description: 'Chiropractors', rewardEligible: true },
  '8042': { category: 'health', subcategory: 'optometrists', description: 'Optometrists & Ophthalmologists', rewardEligible: true },
  '8043': { category: 'health', subcategory: 'opticians', description: 'Opticians & Eyeglasses', rewardEligible: true },
  '8049': { category: 'health', subcategory: 'podiatrists', description: 'Podiatrists & Chiropodists', rewardEligible: true },
  '8050': { category: 'health', subcategory: 'nursing', description: 'Nursing & Personal Care Facilities', rewardEligible: true },
  '8062': { category: 'health', subcategory: 'hospitals', description: 'Hospitals', rewardEligible: true },
  '8071': { category: 'health', subcategory: 'dental_lab', description: 'Medical & Dental Laboratories', rewardEligible: true },
  '8099': { category: 'health', subcategory: 'medical_services', description: 'Medical Services & Health Practitioners', rewardEligible: true },

  // =====================================================
  // EDUCATION
  // =====================================================
  '8211': { category: 'education', subcategory: 'schools', description: 'Elementary & Secondary Schools', rewardEligible: true },
  '8220': { category: 'education', subcategory: 'colleges', description: 'Colleges & Universities', rewardEligible: true },
  '8241': { category: 'education', subcategory: 'correspondence', description: 'Correspondence Schools', rewardEligible: true },
  '8244': { category: 'education', subcategory: 'business_schools', description: 'Business & Secretarial Schools', rewardEligible: true },
  '8249': { category: 'education', subcategory: 'vocational', description: 'Vocational & Trade Schools', rewardEligible: true },
  '8299': { category: 'education', subcategory: 'other_education', description: 'Educational Services', rewardEligible: true },

  // =====================================================
  // SERVICES
  // =====================================================
  '7210': { category: 'services', subcategory: 'laundry', description: 'Laundry & Cleaning Services', rewardEligible: true },
  '7211': { category: 'services', subcategory: 'laundry', description: 'Laundry: Family & Commercial', rewardEligible: true },
  '7216': { category: 'services', subcategory: 'dry_cleaning', description: 'Dry Cleaners', rewardEligible: true },
  '7217': { category: 'services', subcategory: 'carpet_cleaning', description: 'Carpet & Upholstery Cleaning', rewardEligible: true },
  '7221': { category: 'services', subcategory: 'photography', description: 'Photographic Studios', rewardEligible: true },
  '7230': { category: 'services', subcategory: 'beauty', description: 'Beauty & Barber Shops', rewardEligible: true },
  '7251': { category: 'services', subcategory: 'shoe_repair', description: 'Shoe Repair & Shine', rewardEligible: true },
  '7261': { category: 'services', subcategory: 'funeral', description: 'Funeral Services & Crematories', rewardEligible: true },
  '7273': { category: 'services', subcategory: 'dating', description: 'Dating & Escort Services', rewardEligible: true },
  '7276': { category: 'services', subcategory: 'tax_prep', description: 'Tax Preparation Services', rewardEligible: true },
  '7277': { category: 'services', subcategory: 'counseling', description: 'Counseling Services', rewardEligible: true },
  '7296': { category: 'services', subcategory: 'clothing_rental', description: 'Clothing Rental', rewardEligible: true },
  '7297': { category: 'services', subcategory: 'massage', description: 'Massage Parlors', rewardEligible: true },
  '7311': { category: 'services', subcategory: 'advertising', description: 'Advertising Services', rewardEligible: true },
  '7321': { category: 'services', subcategory: 'credit_reporting', description: 'Consumer Credit Reporting', rewardEligible: true },
  '7333': { category: 'services', subcategory: 'commercial_photo', description: 'Commercial Photography & Art', rewardEligible: true },
  '7338': { category: 'services', subcategory: 'copying', description: 'Quick Copy & Reproduction', rewardEligible: true },
  '7339': { category: 'services', subcategory: 'stenographic', description: 'Stenographic Services', rewardEligible: true },
  '7342': { category: 'services', subcategory: 'exterminating', description: 'Exterminating & Disinfecting', rewardEligible: true },
  '7349': { category: 'services', subcategory: 'cleaning', description: 'Cleaning & Maintenance', rewardEligible: true },
  '7361': { category: 'services', subcategory: 'employment', description: 'Employment Agencies & Temp Services', rewardEligible: true },
  '7372': { category: 'services', subcategory: 'computer_software', description: 'Computer Programming & Processing', rewardEligible: true },
  '7379': { category: 'services', subcategory: 'computer_repair', description: 'Computer Maintenance & Repair', rewardEligible: true },
  '7392': { category: 'services', subcategory: 'management', description: 'Management & Public Relations', rewardEligible: true },
  '7393': { category: 'services', subcategory: 'detective', description: 'Detective & Protective Services', rewardEligible: true },
  '7394': { category: 'services', subcategory: 'equipment_rental', description: 'Equipment, Tool & Furniture Rental', rewardEligible: true },
  '7395': { category: 'services', subcategory: 'photo_developing', description: 'Photo Developing', rewardEligible: true },
  '7399': { category: 'services', subcategory: 'misc_business', description: 'Miscellaneous Business Services', rewardEligible: true },

  // =====================================================
  // AUTOMOTIVE
  // =====================================================
  '5511': { category: 'automotive', subcategory: 'dealers_new', description: 'Car & Truck Dealers (New)', rewardEligible: true },
  '5521': { category: 'automotive', subcategory: 'dealers_used', description: 'Car & Truck Dealers (Used)', rewardEligible: true },
  '5531': { category: 'automotive', subcategory: 'auto_parts', description: 'Auto & Home Supply Stores', rewardEligible: true },
  '5532': { category: 'automotive', subcategory: 'tire_stores', description: 'Automotive Tire Stores', rewardEligible: true },
  '5533': { category: 'automotive', subcategory: 'auto_parts', description: 'Automotive Parts & Accessories', rewardEligible: true },
  '5571': { category: 'automotive', subcategory: 'motorcycle', description: 'Motorcycle Shops & Dealers', rewardEligible: true },
  '7531': { category: 'automotive', subcategory: 'body_repair', description: 'Automotive Body Repair', rewardEligible: true },
  '7534': { category: 'automotive', subcategory: 'tire_retread', description: 'Tire Retreading & Repair', rewardEligible: true },
  '7535': { category: 'automotive', subcategory: 'paint', description: 'Automotive Paint Shops', rewardEligible: true },
  '7538': { category: 'automotive', subcategory: 'auto_service', description: 'Automotive Service Shops', rewardEligible: true },
  '7542': { category: 'automotive', subcategory: 'car_wash', description: 'Car Washes', rewardEligible: true },
  '7549': { category: 'automotive', subcategory: 'towing', description: 'Towing Services', rewardEligible: true },

  // =====================================================
  // HOME IMPROVEMENT
  // =====================================================
  '1520': { category: 'home_improvement', subcategory: 'general_contractor', description: 'General Contractors: Residential', rewardEligible: true },
  '1711': { category: 'home_improvement', subcategory: 'hvac', description: 'Heating, Plumbing, A/C', rewardEligible: true },
  '1731': { category: 'home_improvement', subcategory: 'electrical', description: 'Electrical Contractors', rewardEligible: true },
  '1740': { category: 'home_improvement', subcategory: 'masonry', description: 'Masonry & Stonework', rewardEligible: true },
  '1750': { category: 'home_improvement', subcategory: 'carpentry', description: 'Carpentry Contractors', rewardEligible: true },
  '1761': { category: 'home_improvement', subcategory: 'roofing', description: 'Roofing & Siding', rewardEligible: true },
  '1771': { category: 'home_improvement', subcategory: 'concrete', description: 'Concrete Work', rewardEligible: true },

  // =====================================================
  // INSURANCE
  // =====================================================
  '5960': { category: 'insurance', subcategory: 'direct_marketing', description: 'Insurance: Direct Marketing', rewardEligible: true },
  '6300': { category: 'insurance', subcategory: 'insurance', description: 'Insurance Sales & Underwriting', rewardEligible: false },

  // =====================================================
  // GOVERNMENT
  // =====================================================
  '9211': { category: 'government', subcategory: 'court_costs', description: 'Court Costs & Alimony', rewardEligible: true },
  '9222': { category: 'government', subcategory: 'fines', description: 'Fines', rewardEligible: true },
  '9311': { category: 'government', subcategory: 'tax_payments', description: 'Tax Payments', rewardEligible: true },
  '9399': { category: 'government', subcategory: 'government_services', description: 'Government Services', rewardEligible: true },
  '9402': { category: 'government', subcategory: 'postal', description: 'Postal Services: Government Only', rewardEligible: true },

  // =====================================================
  // NON-PROFIT & CHARITABLE
  // =====================================================
  '8398': { category: 'charitable', subcategory: 'charitable', description: 'Charitable & Social Service Organizations', rewardEligible: true },
  '8641': { category: 'charitable', subcategory: 'civic_organizations', description: 'Civic, Social & Fraternal Organizations', rewardEligible: true },
  '8651': { category: 'charitable', subcategory: 'political', description: 'Political Organizations', rewardEligible: true },
  '8661': { category: 'charitable', subcategory: 'religious', description: 'Religious Organizations', rewardEligible: true },
  '8699': { category: 'charitable', subcategory: 'membership', description: 'Membership Organizations', rewardEligible: true },

  // =====================================================
  // FINANCIAL SERVICES (NON-REWARD-ELIGIBLE)
  // =====================================================
  '6010': { category: 'financial', subcategory: 'financial_institutions', description: 'Financial Institutions: Manual Cash Disbursement', rewardEligible: false },
  '6011': { category: 'financial', subcategory: 'atm', description: 'Financial Institutions: ATM Cash Disbursement', rewardEligible: false },
  '6012': { category: 'financial', subcategory: 'financial_institutions', description: 'Financial Institutions: Merchandise & Services', rewardEligible: false },
  '6051': { category: 'financial', subcategory: 'quasi_cash', description: 'Non-Financial Institutions: Foreign Currency, Money Orders', rewardEligible: false },
  '6211': { category: 'financial', subcategory: 'securities', description: 'Security Brokers & Dealers', rewardEligible: false },
  '6399': { category: 'financial', subcategory: 'insurance_premium', description: 'Insurance: Not Elsewhere Classified', rewardEligible: false },
  '6513': { category: 'financial', subcategory: 'real_estate', description: 'Real Estate Agents & Managers', rewardEligible: true },
  '6536': { category: 'financial', subcategory: 'wire_transfer', description: 'MoneySend Intracountry', rewardEligible: false },
  '6537': { category: 'financial', subcategory: 'wire_transfer', description: 'MoneySend Intercountry', rewardEligible: false },
  '6540': { category: 'financial', subcategory: 'funding_transaction', description: 'POI Funding Transactions', rewardEligible: false },
};

/**
 * Lookup an MCC code and return its category information.
 * Returns null if the MCC code is not found.
 */
export function lookupMCC(mccCode: string): MCCEntry | null {
  return MCC_CATALOG[mccCode] || null;
}

/**
 * Get all MCC codes for a given category.
 */
export function getMCCCodesForCategory(category: string): string[] {
  return Object.entries(MCC_CATALOG)
    .filter(([, entry]) => entry.category === category)
    .map(([code]) => code);
}

/**
 * Get all unique categories in the catalog.
 */
export function getAllCategories(): string[] {
  const categories = new Set(Object.values(MCC_CATALOG).map((e) => e.category));
  return Array.from(categories).sort();
}

/**
 * Check if an MCC code is reward-eligible.
 */
export function isRewardEligible(mccCode: string): boolean {
  const entry = MCC_CATALOG[mccCode];
  if (!entry) return true; // Default to eligible for unknown codes
  return entry.rewardEligible;
}
