import 'dotenv/config';
import { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } from '@aws-sdk/client-s3';
import { env } from '../config/env';
const s3 = new S3Client({ region: env.b2.region, endpoint: env.b2.endpoint, credentials: { accessKeyId: env.b2.keyId, secretAccessKey: env.b2.appKey } });
(async () => {
  try {
    await s3.send(new PutBucketCorsCommand({ Bucket: env.b2.bucket, CORSConfiguration: { CORSRules: [{
      AllowedOrigins: ['http://localhost:5173', 'http://localhost:4173', 'https://krishnagurukul.in', 'https://www.krishnagurukul.in', 'https://*.vercel.app'],
      AllowedMethods: ['GET', 'PUT', 'HEAD'], AllowedHeaders: ['*'], ExposeHeaders: ['ETag'], MaxAgeSeconds: 3600 }] } }));
    console.log('CORS set:', JSON.stringify((await s3.send(new GetBucketCorsCommand({ Bucket: env.b2.bucket }))).CORSRules?.[0]?.AllowedOrigins));
  } catch (e: any) { console.log('CORS failed:', e.name, e.message?.slice(0, 200)); }
})();
