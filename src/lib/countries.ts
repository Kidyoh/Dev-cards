/**
 * GitHub "location" is free text ("Lagos", "Addis Ababa, ET", "🇰🇪 Nairobi"). We map it to a country
 * with a list of names, codes and big cities. Unknown locations are stored as NULL.
 */
export const COUNTRY_ALIASES: Record<string, string[]> = {
  Ethiopia: [
    "ethiopia", "ethiopian", "addis ababa", "addis abeba", "addis", "adama", "nazret", "bahir dar", "bahirdar",
    "hawassa", "awassa", "mekelle", "mekele", "dire dawa", "gondar", "gonder", "jimma", "dessie", "bishoftu",
    "debre zeit", "arba minch", "harar", "jijiga", "shashemene", "debre markos", "debre birhan", "wolaita", "🇪🇹",
  ],
  Nigeria: ["nigeria", "lagos", "abuja", "ibadan", "port harcourt", "enugu", "naija", "🇳🇬"],
  Kenya: ["kenya", "nairobi", "mombasa", "kisumu", "🇰🇪"],
  Ghana: ["ghana", "accra", "kumasi", "🇬🇭"],
  "South Africa": ["south africa", "cape town", "johannesburg", "pretoria", "durban", "🇿🇦"],
  Egypt: ["egypt", "cairo", "alexandria", "giza", "🇪🇬"],
  Rwanda: ["rwanda", "kigali", "🇷🇼"],
  Uganda: ["uganda", "kampala", "🇺🇬"],
  Tanzania: ["tanzania", "dar es salaam", "🇹🇿"],
  Morocco: ["morocco", "casablanca", "rabat", "marrakech", "🇲🇦"],
  India: ["india", "bangalore", "bengaluru", "mumbai", "delhi", "hyderabad", "pune", "chennai", "kolkata", "noida", "gurgaon", "🇮🇳"],
  Pakistan: ["pakistan", "karachi", "lahore", "islamabad", "🇵🇰"],
  Bangladesh: ["bangladesh", "dhaka", "🇧🇩"],
  Indonesia: ["indonesia", "jakarta", "bandung", "🇮🇩"],
  Japan: ["japan", "tokyo", "osaka", "kyoto", "日本", "🇯🇵"],
  China: ["china", "beijing", "shanghai", "shenzhen", "hangzhou", "guangzhou", "中国", "🇨🇳"],
  "South Korea": ["south korea", "korea", "seoul", "busan", "🇰🇷"],
  Vietnam: ["vietnam", "viet nam", "hanoi", "ho chi minh", "🇻🇳"],
  Brazil: ["brazil", "brasil", "são paulo", "sao paulo", "rio de janeiro", "🇧🇷"],
  Argentina: ["argentina", "buenos aires", "🇦🇷"],
  Mexico: ["mexico", "méxico", "cdmx", "guadalajara", "monterrey", "🇲🇽"],
  Colombia: ["colombia", "bogotá", "bogota", "medellín", "medellin", "🇨🇴"],
  "United States": ["united states", "usa", "u.s.", "san francisco", "new york", "seattle", "los angeles", "austin", "boston", "chicago", "california", "bay area", "nyc", "🇺🇸"],
  Canada: ["canada", "toronto", "vancouver", "montreal", "ottawa", "🇨🇦"],
  "United Kingdom": ["united kingdom", "uk", "england", "london", "manchester", "scotland", "edinburgh", "🇬🇧"],
  Germany: ["germany", "deutschland", "berlin", "munich", "münchen", "hamburg", "🇩🇪"],
  France: ["france", "paris", "lyon", "🇫🇷"],
  Spain: ["spain", "españa", "madrid", "barcelona", "🇪🇸"],
  Netherlands: ["netherlands", "amsterdam", "rotterdam", "🇳🇱"],
  Poland: ["poland", "polska", "warsaw", "kraków", "krakow", "🇵🇱"],
  Ukraine: ["ukraine", "kyiv", "kiev", "lviv", "🇺🇦"],
  Turkey: ["turkey", "türkiye", "istanbul", "ankara", "🇹🇷"],
  Australia: ["australia", "sydney", "melbourne", "brisbane", "🇦🇺"],
};

export const COUNTRIES = Object.keys(COUNTRY_ALIASES);

export function countryFromLocation(location: string | null | undefined): string | null {
  if (!location) return null;
  const l = ` ${location.toLowerCase()} `;
  for (const [country, aliases] of Object.entries(COUNTRY_ALIASES)) {
    for (const a of aliases) {
      // short codes like "uk"/"usa" must be whole words
      if (a.length <= 3 ? new RegExp(`[^a-z]${a.replace(/\./g, "\\.")}[^a-z]`).test(l) : l.includes(a)) return country;
    }
  }
  return null;
}
