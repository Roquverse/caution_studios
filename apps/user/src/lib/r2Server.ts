import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const accountId = process.env.R2_ACCOUNT_ID || 'f36f0330e251899bfc0d1eff48a006b6';
const accessKeyId = process.env.R2_ACCESS_KEY_ID || 'f2fe6c68e00a09f04a4db39bfaa3fc4b';
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || 'cd89e59b4062769f96d5bebbdf3de2cb7933bd1edc2e5cab693a3f67624daf01';
export const R2_BUCKET = process.env.R2_BUCKET_NAME || 'caution-studio-audio';

export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey
  }
});

export async function uploadToR2(key: string, body: Buffer | Uint8Array, contentType: string) {
  await r2.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType
  }));
  return key;
}

export async function getFromR2(key: string, range?: string) {
  return await r2.send(new GetObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Range: range || undefined
  }));
}
