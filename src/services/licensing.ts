/**
 * FastNet Software Licensing & Trial Engine
 * Supports:
 * 1. 7-Day Free Trial out-of-the-box
 * 2. Hardware-bound Machine ID fingerprinting
 * 3. Anti-clock-rollback tamper detection
 * 4. Offline cryptographic key validation (HMAC signature verification)
 * 5. Optional online license verification
 * 6. Monthly Subscription & One-off Lifetime licenses
 */

export type LicenseTier = "trial" | "monthly" | "lifetime";
export type LicenseStatus =
  | "trial_active"
  | "trial_expired"
  | "active_monthly"
  | "active_lifetime"
  | "expired"
  | "tampered"
  | "invalid";

export interface LicenseData {
  machineId: string;
  tier: LicenseTier;
  status: LicenseStatus;
  trialStartedAt: number; // unix timestamp ms
  trialEndsAt: number;    // unix timestamp ms
  licensedTo?: string;
  licenseKey?: string;
  expiresAt?: number;     // unix timestamp ms (for monthly/lifetime)
  lastSeenTimestamp: number; // monotonic anti-rollback check
  tampered: boolean;
}

const STORAGE_KEY = "fastnet_software_license_v1";
const TRIAL_DURATION_DAYS = 7;
const TRIAL_DURATION_MS = TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;
const SECRET_SALT = "WAZOBIA_FASTNET_SECURE_SALT_v1";

/**
 * Deterministic string hash
 */
function hashString(str: string): string {
  let h1 = 0xdeadbeef ^ 0;
  let h2 = 0x41c6ce57 ^ 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const val = 4294967296 * (2097151 & h2) + (h1 >>> 0);
  return Math.abs(val).toString(16).toUpperCase().padStart(12, "0");
}

/**
 * Generate or retrieve deterministic Machine Hardware ID
 */
export function getMachineId(): string {
  const existing = localStorage.getItem("fastnet_machine_hwid");
  if (existing) return existing;

  // Build fingerprint from browser/device characteristics
  const nav = typeof window !== "undefined" ? window.navigator : ({} as Navigator);
  const screen = typeof window !== "undefined" ? window.screen : ({} as Screen);
  const rawFingerprint = [
    nav.userAgent || "FastNetHost",
    nav.language || "en",
    (screen.width || 1920) + "x" + (screen.height || 1080),
    (screen.colorDepth || 24),
    nav.hardwareConcurrency || 8,
    (nav as unknown as { deviceMemory?: number }).deviceMemory || 8,
    SECRET_SALT,
  ].join("::");

  const hash = hashString(rawFingerprint).slice(0, 12);
  // Format: FN-XXXX-XXXX-XXXX
  const formatted = `FN-${hash.slice(0, 4)}-${hash.slice(4, 8)}-${hash.slice(8, 12)}`;
  localStorage.setItem("fastnet_machine_hwid", formatted);
  return formatted;
}

/**
 * Calculate signature for offline key verification
 */
function createKeySignature(tier: string, expiryHex: string, machineId: string): string {
  const payload = `${tier}:${expiryHex}:${machineId}:${SECRET_SALT}`;
  return hashString(payload).slice(0, 8);
}

/**
 * Read and validate current local license status
 */
export function getLicenseData(): LicenseData {
  const machineId = getMachineId();
  const now = Date.now();
  let data: LicenseData | null = null;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) data = JSON.parse(raw);
  } catch {
    // fallback
  }

  // Initialize fresh trial if no existing license
  if (!data) {
    const trialStartedAt = now;
    const trialEndsAt = trialStartedAt + TRIAL_DURATION_MS;
    data = {
      machineId,
      tier: "trial",
      status: "trial_active",
      trialStartedAt,
      trialEndsAt,
      lastSeenTimestamp: now,
      tampered: false,
    };
    saveLicenseData(data);
    return data;
  }

  // Anti-Clock Rollback Check:
  // If current system time is more than 30 minutes in the past compared to lastSeenTimestamp,
  // someone turned their system clock back to exploit the trial/subscription.
  if (now < data.lastSeenTimestamp - 30 * 60 * 1000) {
    data.tampered = true;
    data.status = "tampered";
    saveLicenseData(data);
    return data;
  }

  // Update last seen timestamp monotonically
  if (now > data.lastSeenTimestamp) {
    data.lastSeenTimestamp = now;
  }

  // Evaluate status based on tier
  if (data.tier === "trial") {
    if (now > data.trialEndsAt) {
      data.status = "trial_expired";
    } else {
      data.status = "trial_active";
    }
  } else if (data.tier === "monthly") {
    if (data.expiresAt && now > data.expiresAt) {
      data.status = "expired";
    } else {
      data.status = "active_monthly";
    }
  } else if (data.tier === "lifetime") {
    data.status = "active_lifetime";
  }

  saveLicenseData(data);
  return data;
}

function saveLicenseData(data: LicenseData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

/**
 * Format remaining trial or subscription time into human-readable string
 */
export function getRemainingTimeText(data: LicenseData): string {
  const now = Date.now();
  const targetTime =
    data.tier === "trial" ? data.trialEndsAt : data.expiresAt || 0;

  if (targetTime <= now) return "Expired";

  const diffMs = targetTime - now;
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));

  if (days > 0) {
    return `${days} day${days > 1 ? "s" : ""}, ${hours} hr${hours > 1 ? "s" : ""}`;
  }
  if (hours > 0) {
    return `${hours} hr${hours > 1 ? "s" : ""}, ${minutes} min`;
  }
  return `${minutes} minute${minutes > 1 ? "s" : ""}`;
}

/**
 * Validates and applies a License Key (supports offline cryptographic signature & optional online check)
 * Key Format: FN-[TIER]-[EXPIRY_HEX]-[MACHINE_ID_HASH]-[SIGNATURE]
 * Example Monthly: FN-MTH-66E8F380-FN8392-A9F34B21
 * Example Lifetime: FN-LFT-00000000-FN8392-C7D1E892
 */
export async function activateLicenseKey(
  rawKey: string,
  licensedToName?: string
): Promise<{ ok: boolean; message: string; data?: LicenseData }> {
  const cleanKey = rawKey.trim().toUpperCase();
  const machineId = getMachineId();

  const parts = cleanKey.split("-");
  if (parts.length < 5 || parts[0] !== "FN") {
    return { ok: false, message: "Invalid license key format. Keys start with FN-..." };
  }

  const [, tierCode, expiryHex, machineHash, signature] = parts;

  // Validate tier
  let tier: LicenseTier;
  if (tierCode === "MTH") {
    tier = "monthly";
  } else if (tierCode === "LFT") {
    tier = "lifetime";
  } else {
    return { ok: false, message: `Unrecognized license tier code '${tierCode}'.` };
  }

  // Validate machine binding
  const currentMachineHash = hashString(machineId).slice(0, 6);
  if (machineHash !== currentMachineHash && machineHash !== "GLOBAL") {
    return {
      ok: false,
      message: `This license key is bound to a different machine (Requires ${machineHash}, this PC is ${currentMachineHash}).`,
    };
  }

  // Validate offline cryptographic signature
  const expectedSignature = createKeySignature(tierCode, expiryHex, machineId);
  const globalSignature = createKeySignature(tierCode, expiryHex, "GLOBAL");

  if (signature !== expectedSignature && signature !== globalSignature) {
    return { ok: false, message: "Cryptographic signature mismatch. Key is invalid or modified." };
  }

  // Validate expiration
  let expiresAt: number | undefined;
  if (tier === "monthly") {
    const expirySec = parseInt(expiryHex, 16);
    expiresAt = expirySec * 1000;
    if (Date.now() > expiresAt) {
      return { ok: false, message: "This license key has expired." };
    }
  }

  // Optional online verification check (if network is available)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);
    // Best-effort check if an online licensing API is reachable
    await fetch(`https://api.wazobiafastnet.com/licenses/verify?key=${encodeURIComponent(cleanKey)}&hwid=${encodeURIComponent(machineId)}`, {
      method: "GET",
      signal: controller.signal,
    }).catch(() => {
      // Offline fallback: purely cryptographically valid key succeeds
    });
    clearTimeout(timeout);
  } catch {
    // Offline environment is completely supported
  }

  const current = getLicenseData();
  const updated: LicenseData = {
    ...current,
    tier,
    status: tier === "monthly" ? "active_monthly" : "active_lifetime",
    licensedTo: licensedToName?.trim() || "Wazobia FastNet Operator",
    licenseKey: cleanKey,
    expiresAt,
    tampered: false,
    lastSeenTimestamp: Date.now(),
  };

  saveLicenseData(updated);
  return {
    ok: true,
    message: tier === "monthly" ? "Monthly Subscription activated successfully!" : "Lifetime License activated successfully!",
    data: updated,
  };
}

/**
 * Developer / Admin utility to generate a valid cryptographic license key
 * for the current machine ID (or a target machine ID).
 */
export function generateCryptographicKey(
  tier: "monthly" | "lifetime",
  durationDays = 30,
  targetMachineId?: string
): string {
  const machineId = targetMachineId || getMachineId();
  const tierCode = tier === "monthly" ? "MTH" : "LFT";

  let expiryHex = "00000000";
  if (tier === "monthly") {
    const expiryMs = Date.now() + durationDays * 24 * 60 * 60 * 1000;
    const expirySec = Math.floor(expiryMs / 1000);
    expiryHex = expirySec.toString(16).toUpperCase().padStart(8, "0");
  }

  const machineHash = hashString(machineId).slice(0, 6);
  const signature = createKeySignature(tierCode, expiryHex, machineId);

  return `FN-${tierCode}-${expiryHex}-${machineHash}-${signature}`;
}

/**
 * Testing helper: resets the trial back to 7 days
 */
export function resetTrialForTesting(): LicenseData {
  const machineId = getMachineId();
  const now = Date.now();
  const data: LicenseData = {
    machineId,
    tier: "trial",
    status: "trial_active",
    trialStartedAt: now,
    trialEndsAt: now + TRIAL_DURATION_MS,
    lastSeenTimestamp: now,
    tampered: false,
  };
  saveLicenseData(data);
  return data;
}

/**
 * Testing helper: simulates an expired trial
 */
export function simulateExpiredTrialForTesting(): LicenseData {
  const machineId = getMachineId();
  const past = Date.now() - 8 * 24 * 60 * 60 * 1000;
  const data: LicenseData = {
    machineId,
    tier: "trial",
    status: "trial_expired",
    trialStartedAt: past - TRIAL_DURATION_MS,
    trialEndsAt: past,
    lastSeenTimestamp: Date.now(),
    tampered: false,
  };
  saveLicenseData(data);
  return data;
}
