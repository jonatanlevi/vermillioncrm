export type SocialNetworkId =
  | "instagram"
  | "tiktok"
  | "snapchat"
  | "youtube_shorts"
  | "facebook"
  | "youtube"
  | "threads"
  | "twitter"
  | "linkedin"
  | "pinterest"
  | "telegram"
  | "whatsapp_channels"
  | "google_business";

export type NetworkCategory = "mobile" | "general" | "professional";

export interface SocialNetworkConfig {
  id: SocialNetworkId;
  nameHe: string;
  nameEn: string;
  category: NetworkCategory;
  icon: string;
  color: string;
  placeholder: string;
  formatHints: string[];
}

export const NETWORK_CATEGORIES: Record<
  NetworkCategory,
  { labelHe: string }
> = {
  mobile: { labelHe: "מובייל מובילים" },
  general: { labelHe: "רשתות כלליות" },
  professional: { labelHe: "מקצועי ועסקי" },
};

export const SOCIAL_NETWORKS: SocialNetworkConfig[] = [
  {
    id: "instagram",
    nameHe: "אינסטגרם",
    nameEn: "Instagram",
    category: "mobile",
    icon: "📸",
    color: "#E4405F",
    placeholder: "צור פוסט/סטורי/ריל לקידום VerMillion באינסטגרם...",
    formatHints: ["ריל", "סטורי", "פוסט קרוסלה", "ביו לינק"],
  },
  {
    id: "tiktok",
    nameHe: "טיקטוק",
    nameEn: "TikTok",
    category: "mobile",
    icon: "🎵",
    color: "#00F2EA",
    placeholder: "צור רעיון לסרטון ויראלי בטיקטוק ל-VerMillion...",
    formatHints: ["סרטון קצר", "טרנד", "הוק ב-3 שניות"],
  },
  {
    id: "snapchat",
    nameHe: "סנאפצ'ט",
    nameEn: "Snapchat",
    category: "mobile",
    icon: "👻",
    color: "#FFFC00",
    placeholder: "צור סטורי/ספוטלייט לקהל צעיר...",
    formatHints: ["סטורי", "ספוטלייט", "AR lens"],
  },
  {
    id: "youtube_shorts",
    nameHe: "יוטיוב שורטס",
    nameEn: "YouTube Shorts",
    category: "mobile",
    icon: "▶️",
    color: "#FF0000",
    placeholder: "צור תסריט לשורטס על VerMillion...",
    formatHints: ["עד 60 שניות", "כותרת חזקה", "CTA"],
  },
  {
    id: "facebook",
    nameHe: "פייסבוק",
    nameEn: "Facebook",
    category: "general",
    icon: "📘",
    color: "#1877F2",
    placeholder: "צור פוסט/קבוצה/מודעה בפייסבוק...",
    formatHints: ["פוסט", "קבוצה", "מודעה ממומנת", "אירוע"],
  },
  {
    id: "youtube",
    nameHe: "יוטיוב",
    nameEn: "YouTube",
    category: "general",
    icon: "📺",
    color: "#FF0000",
    placeholder: "צור תסריט לסרטון ארוך או תיאור ערוץ...",
    formatHints: ["סרטון ארוך", "תיאור", "תמונת ממוזערת"],
  },
  {
    id: "threads",
    nameHe: "Threads",
    nameEn: "Threads",
    category: "general",
    icon: "🧵",
    color: "#FFFFFF",
    placeholder: "צור שרשור ל-Threads על VerMillion...",
    formatHints: ["שרשור", "תגובות", "קהילה"],
  },
  {
    id: "twitter",
    nameHe: "X (טוויטר)",
    nameEn: "X / Twitter",
    category: "general",
    icon: "𝕏",
    color: "#1DA1F2",
    placeholder: "צור ציוץ או שרשור ל-X...",
    formatHints: ["ציוץ", "שרשור", "תמונה"],
  },
  {
    id: "linkedin",
    nameHe: "לינקדאין",
    nameEn: "LinkedIn",
    category: "professional",
    icon: "💼",
    color: "#0A66C2",
    placeholder: "צור פוסט מקצועי ללינקדאין...",
    formatHints: ["מאמר", "פוסט B2B", "ניוזלטר"],
  },
  {
    id: "pinterest",
    nameHe: "פינטרסט",
    nameEn: "Pinterest",
    category: "professional",
    icon: "📌",
    color: "#E60023",
    placeholder: "צור פין/לוח השראה ל-VerMillion...",
    formatHints: ["פין", "לוח", "ויזואלי"],
  },
  {
    id: "telegram",
    nameHe: "טלגרם",
    nameEn: "Telegram",
    category: "professional",
    icon: "✈️",
    color: "#26A5E4",
    placeholder: "צור הודעה לערוץ/קבוצת טלגרם...",
    formatHints: ["ערוץ", "קבוצה", "בוט"],
  },
  {
    id: "whatsapp_channels",
    nameHe: "וואטסאפ ערוצים",
    nameEn: "WhatsApp Channels",
    category: "professional",
    icon: "💬",
    color: "#25D366",
    placeholder: "צור עדכון לערוץ וואטסאפ עסקי...",
    formatHints: ["ערוץ", "סטטוס", "עדכון לקוחות"],
  },
  {
    id: "google_business",
    nameHe: "Google Business",
    nameEn: "Google Business",
    category: "professional",
    icon: "📍",
    color: "#4285F4",
    placeholder: "צור פוסט לפרופיל העסק בגוגל...",
    formatHints: ["פוסט", "מבצע", "ביקורות"],
  },
];

export function getNetwork(id: string): SocialNetworkConfig | undefined {
  return SOCIAL_NETWORKS.find((n) => n.id === id);
}

export function networksByCategory(category: NetworkCategory) {
  return SOCIAL_NETWORKS.filter((n) => n.category === category);
}
