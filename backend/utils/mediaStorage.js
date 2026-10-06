import crypto from "crypto";
import fs from "fs/promises";

const hasCloudinaryConfig = () => Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

const localPath = (file) => file.path.replace(/\\/g, "/");

/**
 * Upload a Multer file to Cloudinary when shared media is configured.
 * Without Cloudinary configuration, retain the existing local-upload behavior.
 */
export const storeMedia = async (file, folder = "salonhub") => {
  if (!file) return "";

  if (!hasCloudinaryConfig()) {
    return localPath(file);
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET.trim();

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
};

export const isRemoteMedia = (value) => /^https?:\/\//i.test(value || "");
