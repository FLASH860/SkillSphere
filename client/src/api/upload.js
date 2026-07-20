import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export async function uploadToCloudinary(file) {
  const bucket = import.meta.env.VITE_SUPABASE_BUCKET;
  const ext = file.name.split('.').pop();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) throw new Error(error.message || 'Upload failed');

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
