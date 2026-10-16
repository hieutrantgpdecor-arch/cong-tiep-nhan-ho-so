import type { ServicePackage } from "@/lib/mock-data";

// Bảng giá do server quyết định; không bao giờ tin giá gửi từ trình duyệt.
export const PACKAGE_PRICES: Record<ServicePackage, number> = {
  co_ban: 15_000_000,
  toan_dien: 30_000_000,
};
