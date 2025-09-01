export interface Plan {
  id: number;
  name: string;
  priceId: string;
  annualDiscountPriceId?: string;
  price: number;
  annualPrice: number;
  description: string;
  limits: {
    seats: number;
  };
  features?: string[];
  isPopular?: boolean;
}

export const stripePlans: Plan[] = [
  {
    id: 1, // custom field
    name: "freelancer", // the name of the plan, it'll be automatically lower cased when stored in the database
    priceId: "price_1RDcLFQs5qqMeBxpdCW9qHGN", // the price id from stripe
    annualDiscountPriceId: "price_1RDcKiQs5qqMeBxp8TNuO0rc", // (optional) the price id for annual billing with a discount
    price: 1000,
    annualPrice: 10000,

    description: "For Freelancers",
    limits: {
      seats: 1, // max number of users in the organization,
    },
    features: [
      "1 User",
      "Unlimited clients",
      "Core CRM features",
      "Basic project management",
      "Simple invoicing",
      "5GB storage",
    ],
  },
  {
    id: 2,
    name: "team", // the name of the plan, it'll be automatically lower cased when stored in the database
    priceId: "price_1RDcMoQs5qqMeBxpsKE0tf34",
    annualDiscountPriceId: "price_1RDcMoQs5qqMeBxpdy8IVBNQ", // (optional) the price id for annual billing with a discount
    description: "For small teams",
    limits: {
      seats: 5,
    },

    price: 5000,
    annualPrice: 50000,
    features: [
      "Up to 5 users",
      "Everything in Starter",
      "Core CRM features",
      "Basic marketing automation",
      "Client portal access",
      "Basic GitHub integration",
      "50GB storage",
    ],
    isPopular: true,
  },
  {
    id: 3,
    name: "agency", // the name of the plan, it'll be automatically lower cased when stored in the database
    priceId: "price_1RRRuKRJcEy6h42h7MTV5tSX",
    annualDiscountPriceId: "price_1RRRuwRJcEy6h42h9sAMTIKC", // (optional) the price id for annual billing with a discount
    description: "For Growing Agencies",
    price: 99000,
    annualPrice: 99000,
    limits: {
      seats: 25,
    },
    features: [
      "Up to 25 users",
      "Everything in Freelancer",
      "Advanced CRM features",
      "Advanced project management",
      "Advanced invoicing",
      "Unlimited storage",
    ],
  },
];
