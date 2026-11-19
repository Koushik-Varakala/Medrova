import { hyderabadAreas, specialties } from "./constants";

export interface ParsedWhatsAppShift {
  rawText: string;
  postingType: "shift" | "job";
  hospitalName: string;
  area: string;
  specialty: string;
  subSpecialtyOrRole?: string;
  date: string; // YYYY-MM-DD (defaults to today)
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  displayTime: string;
  pay: number;
  contactPhone: string;
  contactName: string;
  contactEmail?: string;
  notes: string;
  confidenceScore: number; // 0 to 100
}

// Expanded Hyderabad & Telangana/Karnataka border micro-locations
const EXTENDED_AREAS = [
  ...hyderabadAreas,
  "Lakdikapul",
  "Kompally",
  "Hyderguda",
  "Masab Tank",
  "Karwan",
  "Nampally",
  "Mehdipatnam",
  "Somajiguda",
  "Attibele",
  "Anekal",
  "Ranga Reddy",
  "Bowenpally",
  "Alwal",
  "Tarnaka",
  "Habsiguda",
  "Sanathnagar",
  "Chandanagar",
  "Tolichowki",
  "Attapur",
  "Vanasthalipuram",
  "Malakpet",
  "Kacheguda",
  "Santosh Nagar",
  "Hayathnagar"
];

// Specialty keyword map for fuzzy/alias matching
const SPECIALTY_MAP: Record<string, string> = {
  // Pediatrics
  paediatric: "Pediatrics",
  paediatrician: "Pediatrics",
  pediatric: "Pediatrics",
  pediatrician: "Pediatrics",
  peds: "Pediatrics",
  paeds: "Pediatrics",
  child: "Pediatrics",
  children: "Pediatrics",
  nicu: "Pediatrics",
  picu: "Pediatrics",
  neonatology: "Pediatrics",

  // Gynecology
  gynec: "Gynecology",
  gynic: "Gynecology",
  gynecology: "Gynecology",
  gynaecology: "Gynecology",
  gynecologist: "Gynecology",
  obstetrics: "Gynecology",
  obg: "Gynecology",
  obs: "Gynecology",
  maternity: "Gynecology",

  // Orthopedics
  ortho: "Orthopedics",
  orthopedic: "Orthopedics",
  orthopedics: "Orthopedics",
  orthopaedics: "Orthopedics",
  orthopedician: "Orthopedics",
  bone: "Orthopedics",

  // Radiology
  radio: "Radiology",
  radiology: "Radiology",
  radiologist: "Radiology",
  ultrasound: "Radiology",
  sonology: "Radiology",
  xray: "Radiology",
  ct: "Radiology",
  mri: "Radiology",

  // Emergency & General
  emergency: "Emergency Medicine",
  casualty: "Emergency Medicine",
  casuality: "Emergency Medicine",
  cmo: "Emergency Medicine",
  er: "Emergency Medicine",
  trauma: "Emergency Medicine",

  // General Physician / RMO
  gp: "General Physician",
  rmo: "General Physician",
  dmo: "General Physician",
  "duty doctor": "General Physician",
  "duty doc": "General Physician",
  "general physician": "General Physician",
  "general medicine": "General Physician",
  mbbs: "General Physician",
  ward: "General Physician",

  // Others
  cardio: "Cardiology",
  cardiology: "Cardiology",
  cardiologist: "Cardiology",
  anesthesia: "Anesthesiology",
  anaesthesia: "Anesthesiology",
  anesthesiology: "Anesthesiology",
  anaesthetist: "Anesthesiology",
  derm: "Dermatology",
  dermatology: "Dermatology",
  skin: "Dermatology",
  ent: "ENT",
  dentist: "Dentistry",
  dental: "Dentistry",
  dentistry: "Dentistry",
  psychiatry: "Psychiatry",
  psychiatrist: "Psychiatry"
};

/**
 * Normalizes Indian 10-digit phone numbers
 */
export function extractPhone(text: string): string {
  // Matches: +91 9885068907, 91-9885068907, 09885068907, 98850 68907, HR-8977524832
  const cleanedText = text.replace(/[\u200B-\u200D\uFEFF]/g, "");
  const phoneRegex = /(?:(?:\+?91[\-\s]?)?|0?)([6-9]\d{4}[\s\-]?\d{5})\b/g;
  const match = phoneRegex.exec(cleanedText);

  if (match && match[1]) {
    return match[1].replace(/[\s\-]/g, "");
  }

  // Fallback: any standalone 10-digit number starting with 6, 7, 8, or 9
  const simpleMatch = text.match(/\b([6-9]\d{9})\b/);
  return simpleMatch ? simpleMatch[1] : "";
}

/**
 * Extracts email address if present
 */
export function extractEmail(text: string): string | undefined {
  const match = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0].toLowerCase() : undefined;
}

/**
 * Detects whether the post is a Shift (duty) or a Full-Time Job
 */
export function detectPostingType(text: string): "shift" | "job" {
  const lower = text.toLowerCase();
  const jobKeywords = [
    "full time",
    "full-time",
    "permanent",
    "registrar",
    "fellowship",
    "post nicu",
    "send cv",
    "forward cv",
    "share cv",
    "forward your cv",
    "monthly salary",
    "vacancy for",
    "career"
  ];

  for (const kw of jobKeywords) {
    if (lower.includes(kw)) {
      return "job";
    }
  }

  return "shift";
}

/**
 * Extracts medical specialty using alias dictionary and standard list
 */
export function extractSpecialty(text: string): { canonical: string; specific?: string } {
  const lower = text.toLowerCase();

  for (const [alias, canonical] of Object.entries(SPECIALTY_MAP)) {
    // Word-boundary match preferred
    const regex = new RegExp(`\\b${alias}\\w*\\b`, "i");
    if (regex.test(lower)) {
      // Check if there is a more specific role (e.g. NICU, Registrar)
      let specific: string | undefined;
      if (lower.includes("nicu")) specific = "NICU";
      if (lower.includes("picu")) specific = "PICU";
      if (lower.includes("registrar")) specific = "Registrar";
      if (lower.includes("rmo")) specific = "RMO";

      return { canonical, specific };
    }
  }

  return { canonical: "General Physician" };
}

/**
 * Extracts Area / Micro-location
 */
export function extractArea(text: string): string {
  const lower = text.toLowerCase();

  for (const area of EXTENDED_AREAS) {
    if (lower.includes(area.toLowerCase())) {
      return area;
    }
  }

  return "Hyderabad";
}

/**
 * Extracts Hospital or Clinic Name
 */
export function extractHospitalName(text: string, area: string): string {
  // Pattern 1: Look specifically for "\bat\s+([A-Za-z0-9'&.,\s]{2,40}?(?:hospital|clinic|nursing home|foundation|children hospital))\b"
  const atMatch = text.match(
    /\bat\s+([A-Z][A-Za-z0-9'&.,\s]{2,40}?(?:hospital|clinic|nursing home|foundation|children hospital|healthcare))\b/i
  );
  if (atMatch && atMatch[1]) {
    return atMatch[1].trim().replace(/\s+(branch|hyderabad)$/i, "");
  }

  // Pattern 2: "at Fernandez Hyderguda branch" -> "Fernandez Hospital"
  const brandMatch = text.match(/\bat\s+([A-Z][a-z]{2,20})\s+(?:branch|hyderguda|banjara|kompally|lakdikapul)/i);
  if (brandMatch && brandMatch[1]) {
    return `${brandMatch[1].trim()} Hospital`;
  }

  // Pattern 3: Explicit capitalized Hospital / Clinic name anywhere in text
  const hospMatch = text.match(/\b([A-Z][A-Za-z0-9'&.,\s]{1,35}?(?:Hospital(?:\s+For\s+[A-Za-z'&,\s]{1,30})?|Clinic|Foundation))\b/);
  if (hospMatch && hospMatch[1]) {
    return hospMatch[1].trim();
  }

  // Fallback: If area known, e.g. "Hospital in Lakdikapul"
  return area !== "Hyderabad" ? `Hospital in ${area}` : "Healthcare Facility";
}

/**
 * Extracts Doctor or HR Contact Person Name
 */
export function extractContactName(text: string): string {
  // Matches "Call Dr Mohammad Amjadullah", "Dr. [Name]"
  const drMatch = text.match(/\b(?:call\s+|contact\s+)?(Dr\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\b/i);
  if (drMatch && drMatch[1]) {
    return drMatch[1].trim();
  }

  // Matches email prefix like "drjaishree" -> "Dr Jaishree"
  const emailDrMatch = text.match(/\bdr([a-z]+)[._]/i);
  if (emailDrMatch && emailDrMatch[1]) {
    const name = emailDrMatch[1].charAt(0).toUpperCase() + emailDrMatch[1].slice(1);
    return `Dr. ${name}`;
  }

  // Matches "HR-8977524832" or "contact HR"
  const hrMatch = text.match(/\b(?:contact\s+)?(HR(?:[\s\-]+[A-Za-z]{2,15})?)\b/i);
  if (hrMatch && hrMatch[1]) {
    return hrMatch[1].trim();
  }

  return "Hospital Administrator";
}

/**
 * Parses Shift Timings (converts to 24h format and standard string)
 */
export function extractTimings(text: string): { startTime: string; endTime: string; displayTime: string } {
  // Match "from 3pm to 9pm", "3pm-9pm", "10:00 am to 6:00 pm", "9am - 5pm"
  const timeRangeRegex = /(\d{1,2}(?::\d{2})?)\s*(am|pm)?\s*(?:to|-)\s*(\d{1,2}(?::\d{2})?)\s*(am|pm)/i;
  const match = text.match(timeRangeRegex);

  if (match) {
    let [, startVal, startMeridiem, endVal, endMeridiem] = match;
    startMeridiem = (startMeridiem || endMeridiem || "pm").toLowerCase();
    endMeridiem = (endMeridiem || "pm").toLowerCase();

    const formatTo24 = (val: string, meridiem: string): string => {
      let [hoursStr, minsStr] = val.split(":");
      let hours = parseInt(hoursStr, 10);
      const mins = minsStr ? parseInt(minsStr, 10) : 0;

      if (meridiem === "pm" && hours < 12) hours += 12;
      if (meridiem === "am" && hours === 12) hours = 0;

      return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
    };

    const start24 = formatTo24(startVal, startMeridiem);
    const end24 = formatTo24(endVal, endMeridiem);

    return {
      startTime: start24,
      endTime: end24,
      displayTime: `${startVal}${startMeridiem.toUpperCase()} – ${endVal}${endMeridiem.toUpperCase()}`
    };
  }

  // Check for "night duty" or "night shift"
  if (/night\s*(duty|shift)/i.test(text)) {
    return {
      startTime: "20:00",
      endTime: "08:00",
      displayTime: "8:00 PM – 8:00 AM (Night Duty)"
    };
  }

  // Check for "morning shift"
  if (/morning\s*(duty|shift)/i.test(text)) {
    return {
      startTime: "08:00",
      endTime: "16:00",
      displayTime: "8:00 AM – 4:00 PM (Morning Duty)"
    };
  }

  // Default standard day shift
  return {
    startTime: "09:00",
    endTime: "17:00",
    displayTime: "9:00 AM – 5:00 PM (Standard Shift)"
  };
}

/**
 * Extracts Pay / Compensation Amount
 */
export function extractPay(text: string): number {
  // Matches "pay 3500", "pay 3.5k", "rs 3000", "3000/-", "salary 45k"
  const payMatch = text.match(/(?:pay|rs\.?|inr|salary)\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(k|\/-)?/i);
  if (payMatch) {
    let amount = parseFloat(payMatch[1]);
    if (payMatch[2] && payMatch[2].toLowerCase() === "k") {
      amount *= 1000;
    }
    return Math.round(amount);
  }

  // Standalone "3000/-" or "3500 rs"
  const standaloneMatch = text.match(/\b(\d{4})\s*(?:\/-|rs|inr)?\b/i);
  if (standaloneMatch) {
    return parseInt(standaloneMatch[1], 10);
  }

  // Default fair market rate for emergency locum shift in Hyderabad
  return 3000;
}

/**
 * MAIN ENTRYPOINT: Parses unstructured WhatsApp text into structured Medrova shift/job
 */
export function parseWhatsAppMessage(text: string): ParsedWhatsAppShift {
  const postingType = detectPostingType(text);
  const contactPhone = extractPhone(text);
  const contactEmail = extractEmail(text);
  const area = extractArea(text);
  const hospitalName = extractHospitalName(text, area);
  const specialtyInfo = extractSpecialty(text);
  const contactName = extractContactName(text);
  const timings = extractTimings(text);
  const pay = extractPay(text);

  // Calculate confidence score based on key extracted fields
  let score = 0;
  if (contactPhone) score += 35;
  if (specialtyInfo.canonical) score += 25;
  if (area !== "Hyderabad") score += 20;
  if (hospitalName !== "Healthcare Facility") score += 20;

  // Tomorrow's date default if night, else today
  const today = new Date();
  const dateStr = today.toISOString().split("T")[0];

  return {
    rawText: text.trim(),
    postingType,
    hospitalName,
    area,
    specialty: specialtyInfo.canonical,
    subSpecialtyOrRole: specialtyInfo.specific,
    date: dateStr,
    startTime: timings.startTime,
    endTime: timings.endTime,
    displayTime: timings.displayTime,
    pay,
    contactPhone,
    contactName,
    contactEmail,
    notes: text.slice(0, 300),
    confidenceScore: Math.min(100, score)
  };
}
