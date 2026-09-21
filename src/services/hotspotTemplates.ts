/**
 * FastNet MikroTik Captive Portal Template Generator
 * 
 * Generates custom login.html and alogin.html files that redirect
 * mobile phones connecting to the Wi-Fi directly to the FastNet persistent portal.
 */

export function generateMikroTikLoginHtml(persistentDomain = "wazobia.fastnet", port = 8080): string {
  const portalUrl = port === 80 ? `http://${persistentDomain}` : `http://${persistentDomain}:${port}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="refresh" content="0; url=${portalUrl}">
  <title>Redirecting to FastNet Hotspot...</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0f172a;
      color: #fff;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      text-align: center;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 32px 24px;
      max-width: 400px;
      width: 100%;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    }
    h2 { margin: 0 0 8px; font-size: 20px; color: #60a5fa; }
    p { margin: 0 0 20px; font-size: 13px; color: #94a3b8; }
    .btn {
      display: inline-block;
      background: #2563eb;
      color: #fff;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 10px;
      font-weight: bold;
      font-size: 14px;
    }
  </style>
  <script>
    // Immediate JavaScript redirection with fallback
    window.location.replace("${portalUrl}");
  </script>
</head>
<body>
  <div class="card">
    <h2>Connecting to FastNet...</h2>
    <p>Please wait while we redirect you to the hotspot portal.</p>
    <a href="${portalUrl}" class="btn">Click Here If Not Redirected</a>
  </div>
</body>
</html>`;
}

export function generateMikroTikAloginHtml(persistentDomain = "wazobia.fastnet", port = 8080): string {
  const portalUrl = port === 80 ? `http://${persistentDomain}` : `http://${persistentDomain}:${port}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="1; url=${portalUrl}">
  <title>Connected - FastNet</title>
  <script>
    window.location.replace("${portalUrl}");
  </script>
</head>
<body style="background:#0f172a;color:#fff;font-family:sans-serif;text-align:center;padding:50px;">
  <h2>You are online!</h2>
  <p>Redirecting to FastNet portal...</p>
</body>
</html>`;
}

export function downloadCaptivePortalFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
