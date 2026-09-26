import crypto from "crypto";
import fs from "fs/promises";

// Values shipped in backend/.env-example. They are documentation placeholders,
// not real credentials, so they must never be treated as a working Cloudinary
// configuration (Cloudinary rejects them with "Unknown API key your_api_key").
const PLACEHOLDER_CONFIG_VALUES = new Set([
  "your_cloud_name",
  "your_api_key",
  "your_api_secret",
]);

const isRealConfigValue = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return false;
  if (PLACEHOLDER_CONFIG_VALUES.has(normalized)) return false;
  // Guard against the rest of the example placeholders (e.g. "your_...").
  return !normalized.startsWith("your_");
};

const hasCloudinaryConfig = () => Boolean(
  isRealConfigValue(process.env.CLOUDINARY_CLOUD_NAME) &&
  isRealConfigValue(process.env.CLOUDINARY_API_KEY) &&
  isRealConfigValue(process.env.CLOUDINARY_API_SECRET)
);

const localPath = (file) => file.path.replace(/\\/g, "/");

let warnedAboutLocalMedia = false;
/**
 * Logs (once per process) why uploads are being stored locally. Never logs
 * credential values — only the reason and the durability implication.
 */
const warnLocalMediaFallback = (reason) => {
  if (warnedAboutLocalMedia) return;
  warnedAboutLocalMedia = true;
  console.warn(
    `[Media] Storing uploads on local disk instead of Cloudinary (${reason}). ` +
    "Local files do not persist on ephemeral hosts such as Render — set real CLOUDINARY_* values before deploying."
  );
};

/**
 * Upload a Multer file to Cloudinary when shared media is configured.
 * Without a real Cloudinary configuration, or if the upload fails, retain the
 * existing local-upload behavior so the surrounding record save still succeeds.
 */
export const storeMedia = async (file, folder = "salonhub") => {
  if (!file) return "";

  if (!hasCloudinaryConfig()) {
    warnLocalMediaFallback("not configured or still using .env-example placeholders");
    return localPath(file);
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET.trim();

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const signaturePayload = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
    const signature = crypto.createHash("sha1").update(signaturePayload).digest("hex");
    const bytes = await fs.readFile(file.path);
    const form = new FormData();

    form.append("file", new Blob([bytes], { type: file.mimetype || "application/octet-stream" }), file.originalname || "upload");
    form.append("api_key", apiKey);
    form.append("timestamp", String(timestamp));
    form.append("folder", folder);
    form.append("signature", signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: form }
    );
    const result = await response.json();

    if (!response.ok || !result.secure_url) {
      throw new Error(result.error?.message || "Image upload failed");
    }

    // The Cloudinary copy is durable; remove the temporary local Multer file.
    await fs.unlink(file.path).catch(() => {});
    return result.secure_url;
  } catch (uploadErr) {
    // A media-store outage must not block creating the staff/salon/customer row.
    // Keep the local file (it becomes the media path) and surface the reason in logs only.
    warnLocalMediaFallback(`Cloudinary upload failed: ${uploadErr.message}`);
    return localPath(file);
  }
};

export const isRemoteMedia = (value) => /^https?:\/\//i.test(value || "");
