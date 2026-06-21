export type Category =
  | "furniture"
  | "electronics"
  | "tools"
  | "collectibles"
  | "sporting_goods"
  | "appliances"
  | "instruments"
  | "clothing"
  | "toys"
  | "books"
  | "other";

export type Condition = "like new" | "good" | "fair" | "needs repair";

export type Classification = "undervalued" | "overvalued";

export type Listing = {
  id: string;
  title: string;
  category: Category;
  condition: Condition;
  asking_price: number;
  estimated_resale_value: number;
  distance_miles: number;
  location: string;
  image: string;
  url: string;
  description?: string;
  posted_at?: string;
};

export type QueueItem = Listing & {
  projected_profit: number;
  margin_pct: number;
  classification: Classification;
};

export type Preference = {
  key: "category" | "condition";
  value: string;
  polarity: "avoid" | "prefer";
};

export type ScanResponse = {
  queue: QueueItem[];
  explanation: string;
  memory_used: Preference[];
};

export type FeedbackRequest = {
  user_id: string;
  item_id: string;
  decision: "reject" | "accept";
  note: string;
};

export type FeedbackResponse = {
  ok: boolean;
  preference_added: Preference | null;
};

export type PreferencesResponse = {
  preferences: Preference[];
};
