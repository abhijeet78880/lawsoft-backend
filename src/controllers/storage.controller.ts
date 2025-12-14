// import { Request, Response } from 'express';
// import storageService from '../services/storage.service.js';



// export async function generatePresignedUpload(req: Request, res: Response) {
//   try {
//     const uploaderId = (req as any).user?.id as string;
//     if (!uploaderId) return res.status(401).json({ error: 'Unauthorized' });

//     const { fileName, mimeType, size } = req.body as any;

//     // generate presigned URL for upload
//     const key = `documents/${uploaderId}-${Date.now()}-${fileName}`;
//     const presigned = await storageService.createPresignedUpload(key, mimeType);
//     if (!presigned) return res.status(501).json({ error: 'Storage not configured' });
//     res.status(201).json({ upload: presigned });
//   } catch (err: any) {
//     res.status(400).json({ error: String(err.message ?? err) });
//   }
// }

// export default {generatePresignedUpload}

import { PutObjectCommand } from '@aws-sdk/client-s3';
import { Request, Response } from 'express';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from '../utils/s3/index.js';

export async function getPreSignedUrl(
  req: Request,
  res: Response
): Promise<Response> {
  try {
    const { fileName, fileType } = req.query;
    const decodedFileName = decodeURIComponent(fileName as string);
    console.log(fileName, fileType, decodedFileName);
    const key = `${decodedFileName}`;

    // create command for signing
    const command = new PutObjectCommand({
      Bucket: 'moni',
      Key: key,
      ContentType: fileType as string,
      ACL: 'public-read',
    });

    // generate pre-signed url
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

    // use the cdn version of the file URL
    const fileUrl = `https://moni.blr1.cdn.digitaloceanspaces.com/${key}`; // makr the region
    console.log("Generated pre-signed URL:", uploadUrl);
    console.log("File URL:", fileUrl);
    return res.status(200).json({ uploadUrl, fileUrl });
  } catch (e) {
    console.log(e);
    return res.status(500).json({
      status: false,
      msg: 'internal server error !',
      log: 'error getting presigned url',
    });
  }
}