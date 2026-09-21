/**
 * FastNet Branding & Customization Service
 * 
 * Allows operators to white-label the application with:
 * - Custom Business Name & Tagline
 * - Custom Logo (Upload / Data URL or Image Link)
 * - Wi-Fi SSID
 * - Support Phone, WhatsApp & Location
 * - Custom Portal Headlines & Currency Symbol
 * - Theme Brand Colors
 */

export interface BrandingConfig {
  businessName: string;
  tagline: string;
  logoUrl: string; // Base64 data URL or external URL
  wifiSsid: string;
  supportPhone: string;
  supportWhatsApp: string;
  supportEmail: string;
  locationAddress: string;
  headline: string;
  subheadline: string;
  currencySymbol: string;
  currencyCode: string;
  brandColor: string;
  accentColor: string;
}

const BRANDING_STORAGE_KEY = "fastnet_branding_config_v1";

export const DEFAULT_BRANDING: BrandingConfig = {
  businessName: "Wazobia FastNet",
  tagline: "Powered by Starlink",
  logoUrl: "",
  wifiSsid: "Wazobia_FastNet_WiFi",
  supportPhone: "+234 800 123 4567",
  supportWhatsApp: "+234 800 123 4567",
  supportEmail: "support@wazobiafastnet.com",
  locationAddress: "Main Campus / Cyber Center",
  headline: "Fast, Reliable Internet from Starlink Satellite",
  subheadline: "Connect in under 2 minutes. Pay securely with Paystack — no registration required.",
  currencySymbol: "₦",
  currencyCode: "NGN",
  brandColor: "#2563EB",
  accentColor: "#10B981",
};

const listeners = new Set<(cfg: BrandingConfig) => void>();

function notifyListeners(cfg: BrandingConfig) {
  listeners.forEach((fn) => {
    try {
      fn(cfg);
    } catch {
      // ignore
    }
  });
}

export function subscribeBranding(callback: (cfg: BrandingConfig) => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function getBrandingConfig(): BrandingConfig {
  try {
    const raw = localStorage.getItem(BRANDING_STORAGE_KEY);
    if (raw) return { ...DEFAULT_BRANDING, ...JSON.parse(raw) };
  } catch {
    // fallback
  }
  return DEFAULT_BRANDING;
}

export function saveBrandingConfig(updates: Partial<BrandingConfig>): BrandingConfig {
  const current = getBrandingConfig();
  const next = { ...current, ...updates };
  try {
    localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  notifyListeners(next);
  return next;
}

export function resetBrandingToDefault(): BrandingConfig {
  try {
    localStorage.removeItem(BRANDING_STORAGE_KEY);
  } catch {
    // ignore
  }
  notifyListeners(DEFAULT_BRANDING);
  return DEFAULT_BRANDING;
}
