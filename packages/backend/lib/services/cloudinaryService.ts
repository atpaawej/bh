import crypto from 'node:crypto'
import { v2 as cloudinary } from 'cloudinary'
import { config } from '../config'

// Configure once at import
cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
})

export interface SignedUploadUrl {
  /** The Cloudinary upload endpoint URL */
  url: string
  /** The generated public ID (includes folder prefix) */
  publicId: string
  /** HMAC-SHA1 signature for the upload params */
  signature: string
  /** Unix timestamp of when the signature was generated */
  timestamp: number
  /** Cloudinary cloud name — needed by some widgets */
  cloudName: string
  /** The API key — needed by some widgets */
  apiKey: string
}

/**
 * Generates a signed upload URL and parameters so the frontend (or a
 * Cloudinary widget) can upload directly to Cloudinary without the API secret.
 *
 * The frontend sends the file as a multipart POST to `url` with the
 * `signature`, `timestamp`, `api_key`, and `public_id` as additional fields.
 *
 * @param folder - The Cloudinary folder to upload into (e.g. "logos", "heroes", "gallery")
 */
export function generateSignedUploadUrl(folder: string): SignedUploadUrl {
  const timestamp = Math.round(Date.now() / 1000)
  const publicId = `${folder}/${crypto.randomBytes(16).toString('hex')}`

  const params: Record<string, string | number> = {
    timestamp,
    public_id: publicId,
  }

  const signature = cloudinary.utils.api_sign_request(
    params,
    config.CLOUDINARY_API_SECRET
  )

  return {
    url: `https://api.cloudinary.com/v1_1/${config.CLOUDINARY_CLOUD_NAME}/auto/upload`,
    publicId,
    signature,
    timestamp,
    cloudName: config.CLOUDINARY_CLOUD_NAME,
    apiKey: config.CLOUDINARY_API_KEY,
  }
}
