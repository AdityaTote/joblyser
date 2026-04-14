CREATE TYPE action_type AS ENUM ('review', 'apply_note', 'cover_letter', 'linkedin_note', 'cold_mail');
CREATE TYPE status_type AS ENUM ('COMPLETED', 'PROCESSING', 'QUEUED', 'PENDING', 'FAILED');

CREATE TABLE users(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password TEXT,
  access_token TEXT,
  refresh_token TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

CREATE TABLE profiles(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  job_title TEXT,
  description TEXT,
  resume_key TEXT,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_profile ON profiles(user_id);
CREATE INDEX idx_users_profile_name ON profiles(user_id, name);

CREATE TABLE documents(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uq_documents_key_user UNIQUE (key, user_id),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_key ON documents(key);
CREATE INDEX idx_documents_key_user ON documents(key, user_id);

CREATE TABLE jobs(
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action action_type NOT NULL,
  doc_key TEXT NOT NULL,
  user_query TEXT NOT NULL,
  status status_type DEFAULT 'PENDING',
  session_id TEXT NOT NULL,
  jd_text TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_jobs_documents_key_user
    FOREIGN KEY (doc_key, user_id)
    REFERENCES documents(key, user_id)
    ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_jobs_user ON jobs(user_id);
CREATE INDEX idx_jobs_doc ON jobs(doc_key);
CREATE INDEX idx_jobs_session ON jobs(session_id);
CREATE INDEX idx_jobs_users_sessions ON jobs(user_id, session_id);

-- function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- triggers
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER user_profile_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER document_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER job_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();