import { S3 } from '@aws-sdk/client-s3';
import { config } from '../../config/index.js';

const s3Client = new S3({
  forcePathStyle: false,
  endpoint: 'https://blr1.digitaloceanspaces.com', // this can change according to the region of your space ex: https://ams3.digitaloceanspaces.com, https://sgp1.digitaloceanspaces.com
  region: 'us-east-1', //  this is from the digital ocean docs, it says a aws region is required , this does not affet performance regradless of the actual region of your space
  credentials: {
    accessKeyId: config.aws.s3.accessKeyId,
    secretAccessKey: config.aws.s3.secretAccessKey,
  },
});

export { s3Client };