export interface Plan {
  id: string;
  name: string;
  duration: string;
  price: number;
  badge?: string;
  features: string[];
}

export const PLANS: Plan[] = [
  {
    id: "1h",
    name: "1 Hour",
    duration: "1 hour",
    price: 500,
    badge: "Popular",
    features: ["Unlimited data", "Full speed", "Instant access"],
  },
  {
    id: "3h",
    name: "3 Hours",
    duration: "3 hours",
    price: 1200,
    features: ["Unlimited data", "Full speed", "Share with family"],
  },
  {
    id: "24h",
    name: "24 Hours",
    duration: "24 hours",
    price: 3000,
    badge: "Best value",
    features: ["Unlimited data", "Full speed", "Work all day"],
  },
  {
    id: "1w",
    name: "1 Week",
    duration: "7 days",
    price: 8000,
    features: ["Unlimited data", "Full speed", "No daily hassle"],
  },
];
