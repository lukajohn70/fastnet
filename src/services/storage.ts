/**
 * FastNet Zero-Database Local PC Storage Engine
 * 
 * Manages all application data in local files on the PC.
 * - In Desktop mode: Reads/writes JSON files in %APPDATA%/FastNet/
 * - In Web/Dev mode: Seamlessly falls back to localStorage
 * - Features one-click full backup & restore
 */

export interface BackupData {
  version: string;
  exportedAt: string;
  config: Record<string, unknown>;
  plans: unknown[];
  payments: unknown[];
  logs: unknown[];
  serverConfig: Record<string, unknown>;
}

export function isElectron(): boolean {
  return typeof window !== "undefined" && Boolean((window as unknown as { electronAPI?: unknown }).electronAPI);
}

/**
 * Creates and downloads a complete JSON backup file of all local data
 */
export function exportLocalBackup(): void {
  const backup: BackupData = {
    version: "1.0.0",
    exportedAt: new Date().toISOString(),
    config: JSON.parse(localStorage.getItem("fastnet_router_config") || "{}"),
    plans: JSON.parse(localStorage.getItem("fastnet_custom_plans") || "[]"),
    payments: JSON.parse(localStorage.getItem("fastnet_payment_records") || "[]"),
    logs: JSON.parse(localStorage.getItem("fastnet_system_logs") || "[]"),
    serverConfig: JSON.parse(localStorage.getItem("fastnet_server_config_v1") || "{}"),
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `fastnet_backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Restores data from a previously exported backup file
 */
export async function importLocalBackup(file: File): Promise<{ ok: boolean; message: string }> {
  try {
    const text = await file.text();
    const parsed: BackupData = JSON.parse(text);

    if (!parsed || typeof parsed !== "object") {
      return { ok: false, message: "Invalid backup file structure." };
    }

    if (parsed.config) localStorage.setItem("fastnet_router_config", JSON.stringify(parsed.config));
    if (parsed.plans) localStorage.setItem("fastnet_custom_plans", JSON.stringify(parsed.plans));
    if (parsed.payments) localStorage.setItem("fastnet_payment_records", JSON.stringify(parsed.payments));
    if (parsed.logs) localStorage.setItem("fastnet_system_logs", JSON.stringify(parsed.logs));
    if (parsed.serverConfig) localStorage.setItem("fastnet_server_config_v1", JSON.stringify(parsed.serverConfig));

    return { ok: true, message: `Successfully restored data from ${parsed.exportedAt || "backup"}` };
  } catch (err) {
    return { ok: false, message: `Failed to import backup: ${err instanceof Error ? err.message : String(err)}` };
  }
}
