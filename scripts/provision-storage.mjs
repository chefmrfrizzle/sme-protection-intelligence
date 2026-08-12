import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Private storage is not configured.");

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const bucketName = "evidence-private";
const { data: existing } = await supabase.storage.getBucket(bucketName);
if (!existing) {
  const { error } = await supabase.storage.createBucket(bucketName, {
    public: false,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf", "text/plain", "text/csv"],
  });
  if (error) throw error;
  process.stdout.write(`Created private bucket ${bucketName}\n`);
} else {
  process.stdout.write(`Private bucket ${bucketName} already exists\n`);
}
