-- ============================================================================
-- TALENTA-TZ - SCHEMA FIX (matches actual app code)
-- This drops the incomplete tables and recreates them with ALL columns
-- the app actually queries. Run the WHOLE script in Supabase SQL Editor.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 0: DROP OLD INCOMPLETE TABLES
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS job_reports CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ----------------------------------------------------------------------------
-- STEP 1: COMPANIES (with owner_id + all columns post-job inserts)
-- ----------------------------------------------------------------------------
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID,
  name TEXT NOT NULL,
  logo_url TEXT,
  website TEXT,
  industry TEXT,
  location TEXT,
  description TEXT,
  verified BOOLEAN DEFAULT FALSE,
  suspended BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- STEP 2: JOBS (with status, region, industry, all filter columns)
-- ----------------------------------------------------------------------------
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  posted_by UUID,
  created_by_role TEXT DEFAULT 'employer',
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  region TEXT,
  industry TEXT,
  position_level TEXT,
  contract_type TEXT,
  qualification TEXT,
  salary_min NUMERIC,
  salary_max NUMERIC,
  currency TEXT DEFAULT 'TZS',
  salary_negotiable BOOLEAN DEFAULT FALSE,
  deadline DATE,
  status TEXT DEFAULT 'published',
  featured BOOLEAN DEFAULT FALSE,
  urgent BOOLEAN DEFAULT FALSE,
  remote_friendly BOOLEAN DEFAULT FALSE,
  requirements TEXT,
  responsibilities TEXT,
  apply_method TEXT DEFAULT 'internal',
  apply_email TEXT,
  apply_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- STEP 3: PROFILES
-- ----------------------------------------------------------------------------
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE,
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- STEP 4: USER_ROLES
-- ----------------------------------------------------------------------------
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  role TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- STEP 5: APPLICATIONS
-- ----------------------------------------------------------------------------
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  user_id UUID,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- STEP 6: JOB_REPORTS (admin page queries this)
-- ----------------------------------------------------------------------------
CREATE TABLE job_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  reason TEXT,
  details TEXT,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- STEP 7: ENABLE RLS
-- ----------------------------------------------------------------------------
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_reports ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- STEP 8: PUBLIC READ POLICIES (so the jobs page can read)
-- ----------------------------------------------------------------------------
CREATE POLICY "public read" ON companies FOR SELECT USING (true);
CREATE POLICY "public read" ON jobs FOR SELECT USING (true);
CREATE POLICY "public read" ON profiles FOR SELECT USING (true);
CREATE POLICY "public read" ON user_roles FOR SELECT USING (true);
CREATE POLICY "public read" ON applications FOR SELECT USING (true);
CREATE POLICY "public read" ON job_reports FOR SELECT USING (true);

-- Allow inserts/updates for authenticated users (so posting jobs works)
CREATE POLICY "auth insert" ON companies FOR INSERT WITH CHECK (true);
CREATE POLICY "auth update" ON companies FOR UPDATE USING (true);
CREATE POLICY "auth insert" ON jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "auth update" ON jobs FOR UPDATE USING (true);
CREATE POLICY "auth insert" ON applications FOR INSERT WITH CHECK (true);
CREATE POLICY "auth insert" ON user_roles FOR INSERT WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- STEP 9: SAMPLE DATA (status = 'published' so jobs page shows them!)
-- ----------------------------------------------------------------------------
INSERT INTO companies (name, description, website, industry, location, verified) VALUES
  ('Tech Company Tanzania', 'A leading tech company in Tanzania', 'https://techcompany.tz', 'Technology', 'Dar es Salaam', true),
  ('Finance Solutions', 'Financial services company', 'https://finance.tz', 'Finance', 'Dar es Salaam', true),
  ('Healthcare Plus', 'Healthcare and medical services', 'https://healthcare.tz', 'Healthcare', 'Arusha', false);

INSERT INTO jobs (title, description, company_id, location, region, industry, contract_type, position_level, qualification, salary_min, salary_max, currency, status, featured) VALUES
  ('Senior Software Engineer', 'Full stack developer needed for web and mobile projects',
   (SELECT id FROM companies WHERE name = 'Tech Company Tanzania' LIMIT 1),
   'Dar es Salaam', 'Dar es Salaam', 'technology', 'full_time', 'senior', 'degree', 500000, 1000000, 'TZS', 'published', true),
  ('Product Manager', 'Manage product development and strategy',
   (SELECT id FROM companies WHERE name = 'Tech Company Tanzania' LIMIT 1),
   'Dar es Salaam', 'Dar es Salaam', 'technology', 'full_time', 'mid', 'degree', 400000, 800000, 'TZS', 'published', false),
  ('Data Analyst', 'Analyze and visualize company data',
   (SELECT id FROM companies WHERE name = 'Finance Solutions' LIMIT 1),
   'Dar es Salaam', 'Dar es Salaam', 'finance', 'full_time', 'mid', 'degree', 300000, 600000, 'TZS', 'published', false),
  ('Medical Doctor', 'General practitioner needed',
   (SELECT id FROM companies WHERE name = 'Healthcare Plus' LIMIT 1),
   'Arusha', 'Arusha', 'healthcare', 'full_time', 'senior', 'degree', 350000, 700000, 'TZS', 'published', false);

-- ============================================================================
-- DONE! Now the /jobs page will show 4 published jobs.
-- ============================================================================
