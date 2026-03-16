// src/data/mockData.js

export const AML_TRANSACTIONS = [
  { id: "TXN001", receiver: "Riya Mehta",        account: "HDFC••4521", amount: 12500,  status: "safe",    score: 0.12, time: "09:14 AM" },
  { id: "TXN002", receiver: "Global Traders Ltd", account: "SBI••8834",  amount: 485000, status: "flagged", score: 0.91, time: "09:32 AM" },
  { id: "TXN003", receiver: "Arjun Patel",        account: "ICICI••2201",amount: 3200,   status: "safe",    score: 0.08, time: "10:05 AM" },
  { id: "TXN004", receiver: "Phantom Exports",    account: "AXIS••7711", amount: 920000, status: "flagged", score: 0.88, time: "10:47 AM" },
  { id: "TXN005", receiver: "Sneha Kapoor",       account: "PNB••3390",  amount: 8750,   status: "safe",    score: 0.19, time: "11:20 AM" },
];

export const REVIEW_QUEUE = [
  { id: "U001", name: "Aditya Sharma",  faceMatch: 94, aadhaarStatus: "verified", risk: "low",    avatar: "AS" },
  { id: "U002", name: "Priya Nair",     faceMatch: 61, aadhaarStatus: "pending",  risk: "medium", avatar: "PN" },
  { id: "U003", name: "Rohan Gupta",    faceMatch: 87, aadhaarStatus: "verified", risk: "low",    avatar: "RG" },
  { id: "U004", name: "Fatima Sheikh",  faceMatch: 38, aadhaarStatus: "failed",   risk: "high",   avatar: "FS" },
  { id: "U005", name: "Vikram Singh",   faceMatch: 79, aadhaarStatus: "pending",  risk: "medium", avatar: "VS" },
];

export const ALERT_FEED = [
  { id: "A001", entity: "Phantom Exports Pvt Ltd", type: "Structuring", score: 0.91, time: "10:47 AM", bank: "AXIS Bank" },
  { id: "A002", entity: "Global Traders Ltd",       type: "Layering",    score: 0.88, time: "09:32 AM", bank: "SBI"       },
  { id: "A003", entity: "Suresh Kumar",             type: "Velocity",    score: 0.65, time: "08:55 AM", bank: "HDFC"      },
  { id: "A004", entity: "TechFin Solutions",        type: "Smurfing",    score: 0.82, time: "07:30 AM", bank: "ICICI"     },
  { id: "A005", entity: "Deepak Verma",             type: "Mule Account",score: 0.44, time: "Yesterday",bank: "PNB"       },
];

export const BANK_LIST = [
  { id: "B001", name: "HDFC Bank",             code: "HDFC0001", users: 14200, flagged: 3,  active: true,  tier: "Tier 1" },
  { id: "B002", name: "State Bank of India",   code: "SBIN0001", users: 48700, flagged: 12, active: true,  tier: "Tier 1" },
  { id: "B003", name: "ICICI Bank",            code: "ICIC0001", users: 22100, flagged: 5,  active: true,  tier: "Tier 1" },
  { id: "B004", name: "Axis Bank",             code: "UTIB0001", users: 9800,  flagged: 8,  active: false, tier: "Tier 2" },
  { id: "B005", name: "Punjab National Bank",  code: "PUNB0001", users: 31400, flagged: 2,  active: true,  tier: "Tier 2" },
];
