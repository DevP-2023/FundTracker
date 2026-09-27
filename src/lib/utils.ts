export function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat("en-IN").format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateShort(date: Date | string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(new Date(date));
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function getTransactionColor(type: string): string {
  switch (type) {
    case "income":
      return "text-emerald-400";
    case "expense":
      return "text-red-400";
    case "investment":
      return "text-blue-400";
    case "transfer":
      return "text-yellow-400";
    case "lending":
      return "text-purple-400";
    case "borrowing":
      return "text-orange-400";
    default:
      return "text-gray-400";
  }
}

export function getTransactionBg(type: string): string {
  switch (type) {
    case "income":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "expense":
      return "bg-red-500/10 text-red-400 border-red-500/20";
    case "investment":
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "transfer":
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    case "lending":
      return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    case "borrowing":
      return "bg-orange-500/10 text-orange-400 border-orange-500/20";
    default:
      return "bg-gray-500/10 text-gray-400 border-gray-500/20";
  }
}

export function getTransactionEmoji(type: string): string {
  switch (type) {
    case "income":
      return "🟢";
    case "expense":
      return "🔴";
    case "investment":
      return "🔵";
    case "transfer":
      return "🟡";
    case "lending":
      return "🟣";
    case "borrowing":
      return "🟠";
    default:
      return "⚪";
  }
}

export function getBudgetColor(percentage: number): string {
  if (percentage >= 100) return "bg-red-500";
  if (percentage >= 90) return "bg-orange-500";
  if (percentage >= 80) return "bg-yellow-500";
  return "bg-emerald-500";
}

export function getBudgetTextColor(percentage: number): string {
  if (percentage >= 100) return "text-red-400";
  if (percentage >= 90) return "text-orange-400";
  if (percentage >= 80) return "text-yellow-400";
  return "text-emerald-400";
}

export function autoCategorize(description: string): string | null {
  const desc = description.toLowerCase();

  const rules: { keywords: string[]; category: string }[] = [
    { keywords: ["mcdonald", "domino", "pizza", "kfc", "burger king", "swiggy", "zomato", "restaurant", "cafe", "coffee", "starbucks", "chai", "dhaba", "mess", "hotel"], category: "Food" },
    { keywords: ["uber", "ola", "rapido", "metro", "bus", "auto", "petrol", "diesel", "fuel", "parking", "toll", "cab", "taxi"], category: "Transportation" },
    { keywords: ["amazon", "flipkart", "myntra", "ajio", "shopping", "mall", "market", "store", "shop"], category: "Shopping" },
    { keywords: ["netflix", "spotify", "hotstar", "prime", "youtube", "movie", "cinema", "theatre", "entertainment", "game"], category: "Entertainment" },
    { keywords: ["electricity", "water", "gas", "internet", "wifi", "broadband", "jio", "airtel", "vi", "bsnl", "mobile", "recharge", "bill"], category: "Bills" },
    { keywords: ["rent", "pg", "hostel", "house", "flat", "apartment"], category: "Rent" },
    { keywords: ["hospital", "doctor", "medicine", "pharmacy", "health", "medical", "clinic", "dental"], category: "Healthcare" },
    { keywords: ["school", "college", "university", "course", "tuition", "book", "education", "fees"], category: "Education" },
    { keywords: ["zerodha", "groww", "upstox", "angel", "hdfc securities", "investment", "mutual fund", "sip", "stock", "share"], category: "Investments" },
    { keywords: ["insurance", "lic", "premium", "policy"], category: "Insurance" },
    { keywords: ["travel", "flight", "train", "hotel", "trip", "tour", "booking", "makemytrip", "goibibo", "irctc"], category: "Travel" },
    { keywords: ["salary", "wage", "payroll"], category: "Salary" },
    { keywords: ["groceries", "bigbasket", "grofers", "blinkit", "dunzo", "dmart", "reliance fresh", "vegetable", "fruit", "supermarket"], category: "Groceries" },
  ];

  for (const rule of rules) {
    for (const keyword of rule.keywords) {
      if (desc.includes(keyword)) return rule.category;
    }
  }

  return null;
}

export const DEFAULT_CATEGORIES = [
  { name: "Food", type: "expense", icon: "🍔", color: "#ef4444", subcategories: ["Restaurants", "Fast Food", "Snacks", "Coffee", "Groceries"] },
  { name: "Transportation", type: "expense", icon: "🚗", color: "#f97316", subcategories: ["Fuel", "Public Transport", "Cab", "Vehicle Maintenance", "Parking"] },
  { name: "Shopping", type: "expense", icon: "🛍️", color: "#a855f7", subcategories: ["Clothing", "Electronics", "Online", "Home Decor"] },
  { name: "Entertainment", type: "expense", icon: "🎬", color: "#ec4899", subcategories: ["Movies", "Streaming", "Games", "Events"] },
  { name: "Bills", type: "expense", icon: "📄", color: "#6366f1", subcategories: ["Electricity", "Water", "Internet", "Mobile", "Gas"] },
  { name: "Rent", type: "expense", icon: "🏠", color: "#8b5cf6", subcategories: ["House Rent", "PG", "Hostel"] },
  { name: "Healthcare", type: "expense", icon: "🏥", color: "#06b6d4", subcategories: ["Doctor", "Medicine", "Dental", "Insurance"] },
  { name: "Education", type: "expense", icon: "📚", color: "#0ea5e9", subcategories: ["Fees", "Books", "Courses", "Tuition"] },
  { name: "Travel", type: "expense", icon: "✈️", color: "#14b8a6", subcategories: ["Flight", "Train", "Hotel", "Tour"] },
  { name: "Insurance", type: "expense", icon: "🛡️", color: "#64748b", subcategories: ["Life", "Health", "Vehicle"] },
  { name: "Investments", type: "expense", icon: "📈", color: "#3b82f6", subcategories: ["Stocks", "Mutual Funds", "SIP"] },
  { name: "Personal", type: "expense", icon: "👤", color: "#f59e0b", subcategories: ["Grooming", "Gym", "Clothing"] },
  { name: "Groceries", type: "expense", icon: "🛒", color: "#84cc16", subcategories: ["Vegetables", "Fruits", "Dairy", "Grains"] },
  { name: "Other", type: "expense", icon: "💰", color: "#94a3b8", subcategories: [] },
  { name: "Salary", type: "income", icon: "💼", color: "#10b981", subcategories: [] },
  { name: "Freelance", type: "income", icon: "💻", color: "#34d399", subcategories: [] },
  { name: "Business", type: "income", icon: "🏢", color: "#6ee7b7", subcategories: [] },
  { name: "Interest", type: "income", icon: "🏦", color: "#a7f3d0", subcategories: [] },
  { name: "Dividends", type: "income", icon: "📊", color: "#d1fae5", subcategories: [] },
  { name: "Gifts", type: "income", icon: "🎁", color: "#fbbf24", subcategories: [] },
  { name: "Refunds", type: "income", icon: "↩️", color: "#60a5fa", subcategories: [] },
  { name: "Other Income", type: "income", icon: "💚", color: "#4ade80", subcategories: [] },
];
