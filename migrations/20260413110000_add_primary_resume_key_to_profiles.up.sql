ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS primary_resume_key TEXT;

UPDATE profiles
SET primary_resume_key = resume_key
WHERE primary_resume_key IS NULL
  AND resume_key IS NOT NULL;
