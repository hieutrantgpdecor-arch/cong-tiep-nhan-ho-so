import { countries, type ServicePackage } from "@/lib/mock-data";
import { PACKAGE_PRICES } from "@/lib/pricing";

export const DEGREE_LEVELS = [
  { value: "thpt", label: "THPT" },
  { value: "dai_hoc", label: "Đại học" },
  { value: "thac_si", label: "Thạc sĩ" },
] as const;

export type DegreeLevel = (typeof DEGREE_LEVELS)[number]["value"];

export interface QuoteInput {
  fullName: string;
  country: string;
  degreeLevel: DegreeLevel;
  package: ServicePackage;
  email: string;
  phone: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Trả về dữ liệu đã làm sạch hoặc null nếu không hợp lệ.
export function parseQuoteInput(body: unknown): QuoteInput | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (
    typeof b.fullName !== "string" ||
    typeof b.country !== "string" ||
    typeof b.degreeLevel !== "string" ||
    typeof b.package !== "string" ||
    typeof b.email !== "string" ||
    typeof b.phone !== "string"
  ) {
    return null;
  }

  const fullName = b.fullName.trim().replace(/\s+/g, " ");
  const country = b.country.trim();
  const email = b.email.trim();
  const phone = b.phone.trim();

  if (fullName.length < 2 || fullName.length > 100) return null;
  if (!(countries as readonly string[]).includes(country)) return null;
  if (!DEGREE_LEVELS.some((d) => d.value === b.degreeLevel)) return null;
  if (!(b.package in PACKAGE_PRICES)) return null;
  if (email.length > 254 || !EMAIL_RE.test(email)) return null;

  const digits = phone.replace(/\D/g, "").length;
  if (phone.length > 30 || !/^\+?[\d\s.\-()]+$/.test(phone) || digits < 9 || digits > 15) {
    return null;
  }

  return {
    fullName,
    country,
    degreeLevel: b.degreeLevel as DegreeLevel,
    package: b.package as ServicePackage,
    email,
    phone,
  };
}
