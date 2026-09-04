export type StorageStatus = "Healthy" | "Near Quota" | "Quota Exceeded";

export type OrganizationStorage = {
  id: string;
  name: string;
  plan: "Starter" | "Professional" | "Business" | "Enterprise";
  usedDisplay: string;
  quotaDisplay: string;
  usedTb: number;
  quotaTb: number;
  usagePercent: number;
  status: StorageStatus;
  breakdown: {
    documents: string;
    images: string;
    attachments: string;
    other: string;
  };
};

export const organizationStorageData: OrganizationStorage[] = [
  {
    id: "tcs",
    name: "TCS",
    plan: "Enterprise",
    usedDisplay: "4.2 TB",
    quotaDisplay: "5 TB",
    usedTb: 4.2,
    quotaTb: 5.0,
    usagePercent: 84,
    status: "Healthy",
    breakdown: { documents: "3.2 TB", images: "600 GB", attachments: "300 GB", other: "100 GB" },
  },
  {
    id: "wipro",
    name: "Wipro",
    plan: "Enterprise",
    usedDisplay: "4.4 TB",
    quotaDisplay: "5 TB",
    usedTb: 4.4,
    quotaTb: 5.0,
    usagePercent: 88,
    status: "Near Quota",
    breakdown: { documents: "3.5 TB", images: "500 GB", attachments: "300 GB", other: "100 GB" },
  },
  {
    id: "hdfc",
    name: "HDFC",
    plan: "Enterprise",
    usedDisplay: "1.85 TB",
    quotaDisplay: "5 TB",
    usedTb: 1.85,
    quotaTb: 5.0,
    usagePercent: 37,
    status: "Healthy",
    breakdown: { documents: "1.4 TB", images: "300 GB", attachments: "100 GB", other: "50 GB" },
  },
  {
    id: "infosys",
    name: "Infosys",
    plan: "Business",
    usedDisplay: "820 GB",
    quotaDisplay: "2 TB",
    usedTb: 0.82,
    quotaTb: 2.0,
    usagePercent: 41,
    status: "Healthy",
    breakdown: { documents: "600 GB", images: "120 GB", attachments: "70 GB", other: "30 GB" },
  },
  {
    id: "reliance",
    name: "Reliance Industries",
    plan: "Enterprise",
    usedDisplay: "1.25 TB",
    quotaDisplay: "5 TB",
    usedTb: 1.25,
    quotaTb: 5.0,
    usagePercent: 25,
    status: "Healthy",
    breakdown: { documents: "950 GB", images: "180 GB", attachments: "80 GB", other: "40 GB" },
  },
  {
    id: "icici",
    name: "ICICI Bank",
    plan: "Business",
    usedDisplay: "640 GB",
    quotaDisplay: "2 TB",
    usedTb: 0.64,
    quotaTb: 2.0,
    usagePercent: 32,
    status: "Healthy",
    breakdown: { documents: "480 GB", images: "100 GB", attachments: "40 GB", other: "20 GB" },
  },
  {
    id: "airtel",
    name: "Bharti Airtel",
    plan: "Business",
    usedDisplay: "410 GB",
    quotaDisplay: "2 TB",
    usedTb: 0.41,
    quotaTb: 2.0,
    usagePercent: 21,
    status: "Healthy",
    breakdown: { documents: "300 GB", images: "70 GB", attachments: "30 GB", other: "10 GB" },
  },
  {
    id: "lt",
    name: "Larsen & Toubro",
    plan: "Professional",
    usedDisplay: "290 GB",
    quotaDisplay: "1 TB",
    usedTb: 0.29,
    quotaTb: 1.0,
    usagePercent: 29,
    status: "Healthy",
    breakdown: { documents: "200 GB", images: "50 GB", attachments: "30 GB", other: "10 GB" },
  },
  {
    id: "adani",
    name: "Adani Enterprises",
    plan: "Starter",
    usedDisplay: "180 GB",
    quotaDisplay: "500 GB",
    usedTb: 0.18,
    quotaTb: 0.5,
    usagePercent: 36,
    status: "Healthy",
    breakdown: { documents: "120 GB", images: "35 GB", attachments: "20 GB", other: "5 GB" },
  },
];

export const storageGrowthTrend = [
  { month: "Jan", usedTb: 6.2 },
  { month: "Feb", usedTb: 7.4 },
  { month: "Mar", usedTb: 8.9 },
  { month: "Apr", usedTb: 10.2 },
  { month: "May", usedTb: 12.4 },
  { month: "Jun", usedTb: 14.04 },
];

export function getStorageOverview() {
  return {
    totalOrganizations: 9,
    totalAllocatedStorage: "27.5 TB",
    usedStorage: "14.04 TB",
    availableStorage: "13.46 TB",
    storageUtilization: "51%",
    organizationsUsingStorage: 9,
    nearQuotaCount: 1,
    quotaExceededCount: 0,
    healthyCount: 8,
  };
}
