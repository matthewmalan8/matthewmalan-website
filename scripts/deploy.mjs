#!/usr/bin/env node
// Deploy `out/` to S3 and invalidate CloudFront.
// Configure via env: AWS_S3_BUCKET, AWS_CLOUDFRONT_DISTRIBUTION_ID, AWS_REGION.

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const bucket = process.env.AWS_S3_BUCKET;
const distId = process.env.AWS_CLOUDFRONT_DISTRIBUTION_ID;
const region = process.env.AWS_REGION ?? "us-east-1";

if (!bucket || !distId) {
  console.error(
    "Missing AWS_S3_BUCKET or AWS_CLOUDFRONT_DISTRIBUTION_ID env vars."
  );
  process.exit(1);
}

const outDir = path.resolve("out");
if (!fs.existsSync(outDir)) {
  console.error("out/ not found. Run `pnpm build` first.");
  process.exit(1);
}

const run = (cmd) => {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
};

run(
  `aws s3 sync ${outDir} s3://${bucket} --delete --region ${region} --cache-control "public,max-age=31536000,immutable" --exclude "*.html" --exclude "sitemap.xml" --exclude "robots.txt"`
);
run(
  `aws s3 sync ${outDir} s3://${bucket} --region ${region} --cache-control "public,max-age=0,must-revalidate" --exclude "*" --include "*.html" --include "sitemap.xml" --include "robots.txt"`
);
run(
  `aws cloudfront create-invalidation --distribution-id ${distId} --paths "/*"`
);

console.log("Deploy complete.");
