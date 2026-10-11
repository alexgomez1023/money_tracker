import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Hosts like Railway can't hold a key file, so the service account key comes in
// as a variable and is written to disk where the Google SDK looks for it.
const credentialsJson = process.env.GOOGLE_CREDENTIALS_JSON;

if (credentialsJson && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  const filePath = path.join(os.tmpdir(), "google-credentials.json");

  fs.writeFileSync(filePath, credentialsJson, { mode: 0o600 });

  process.env.GOOGLE_APPLICATION_CREDENTIALS = filePath;
}
