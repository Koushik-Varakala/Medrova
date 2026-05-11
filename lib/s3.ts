import { S3Client } from "@aws-sdk/client-s3";
import { requireEnv } from "@/lib/utils";

export function createS3Client() {
  return new S3Client({
    region: requireEnv("AWS_REGION"),
    credentials: {
      accessKeyId: requireEnv("AWS_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("AWS_SECRET_ACCESS_KEY")
    }
  });
}

export function getS3BucketName() {
  return requireEnv("AWS_S3_BUCKET");
}
