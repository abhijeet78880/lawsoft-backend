import config from '../config/index.js';
import { S3Client,PutObjectCommand, CreateBucketCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
/**
 * storage service: create presigned URLs for direct client uploads (S3)
 */
const client = new S3Client({ endpoint: config.aws.s3.endpoint, region: config.aws.s3.region, credentials: { accessKeyId: config.aws.s3.accessKeyId!, secretAccessKey: config.aws.s3.secretAccessKey! } as any });

// try{
//     client.send(new CreateBucketCommand({Bucket:config.aws.s3.bucket}));
// }catch(err : any){
//     console.error("Error in S3 Client Creation:", err.name);
// }

export async function createPresignedUpload(key: string, contentType = 'application/octet-stream', expiresInSec = 3600) {
  if (config.aws?.s3?.bucket && config.aws?.s3?.accessKeyId && config.aws?.s3?.secretAccessKey) {
    // const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
    // const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

    
    const cmd = new PutObjectCommand({ Bucket: config.aws.s3.bucket, Key: key, ContentType: contentType, ACL: 'public-read' });
    const uploadUrl = await getSignedUrl(client, cmd, { expiresIn: expiresInSec });
    const endpointHost = new URL(config.aws.s3.endpoint!).hostname;
    const fileUrl = `https://${config.aws.s3.bucket}.${endpointHost}/${key}`
    return { uploadUrl, fileUrl, method: 'PUT' };
  }

  return null;
}

export default { createPresignedUpload };
