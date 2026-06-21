export type Listing = {
  id: string;
  title: string;
  price: number;
  category: string;
  color: string;
  image: string;
  url: string;
  description?: string;
  location?: string;
  posted_at?: string;
  attributes?: Record<string, unknown>;
};

export type Preference = {
  key: string;
  value: string;
  polarity: "avoid" | "prefer";
};

export type SearchResponse = {
  results: Listing[];
  explanation: string;
  memory_used: Preference[];
};

export type FeedbackResponse = {
  ok: boolean;
  preference_added: Preference | null;
};

export type PreferencesResponse = {
  preferences: Preference[];
};
