-- ============================================================================
-- TALENTA-TZ COMPLETE SQL SCRIPT
-- Run all commands in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE ALL TABLES
-- ============================================================================

-- TABLE 1: USERS
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'job_seeker',
  created_at TIMESTAMP DEFAULT NOW()
);

-- TABLE 2: COMPANIES
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  logo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- TABLE 3: JOBS
CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  company_id UUID,
  salary_min NUMERIC,
  salary_max NUMERIC,
  location TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (company_id) REFERENCES companies(id)
);

-- TABLE 4: PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- TABLE 5: APPLICATIONS
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  user_id UUID NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- TABLE 6: INSTITUTIONS (for V2)
CREATE TABLE IF NOT EXISTS institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  country TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- TABLE 7: STUDENT_VERIFICATION_REQUESTS (for V2)
CREATE TABLE IF NOT EXISTS student_verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  institution_id UUID NOT NULL,
  enrollment_number TEXT,
  graduation_date DATE,
  status TEXT DEFAULT 'pending',
  document_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE
);

-- TABLE 8: TALENT_SHOWCASES (for V2)
CREATE TABLE IF NOT EXISTS talent_showcases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  item_type TEXT,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT,
  visibility TEXT DEFAULT 'public',
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- TABLE 9: RECRUITMENT_AGENCIES (for V3)
CREATE TABLE IF NOT EXISTS recruitment_agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- TABLE 10: RECRUITMENT_PROJECTS (for V3)
CREATE TABLE IF NOT EXISTS recruitment_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  budget NUMERIC,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (agency_id) REFERENCES recruitment_agencies(id) ON DELETE CASCADE
);

-- TABLE 11: RECRUITMENT_AGENCY_STAFF (for V3)
CREATE TABLE IF NOT EXISTS recruitment_agency_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (agency_id) REFERENCES recruitment_agencies(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================================
-- STEP 2: ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE talent_showcases ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruitment_agency_staff ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 3: CREATE READ POLICIES (Allow public read access for testing)
-- ============================================================================

-- COMPANIES - Public read
CREATE POLICY "Enable read access for all users" ON companies
  FOR SELECT USING (true);

-- JOBS - Public read
CREATE POLICY "Enable read access for all users" ON jobs
  FOR SELECT USING (true);

-- PROFILES - Public read
CREATE POLICY "Enable read access for all users" ON profiles
  FOR SELECT USING (true);

-- INSTITUTIONS - Public read
CREATE POLICY "Enable read access for all users" ON institutions
  FOR SELECT USING (true);

-- APPLICATIONS - Public read
CREATE POLICY "Enable read access for all users" ON applications
  FOR SELECT USING (true);

-- TALENT_SHOWCASES - Public read
CREATE POLICY "Enable read access for all users" ON talent_showcases
  FOR SELECT USING (true);

-- STUDENT_VERIFICATION_REQUESTS - Public read
CREATE POLICY "Enable read access for all users" ON student_verification_requests
  FOR SELECT USING (true);

-- RECRUITMENT_AGENCIES - Public read
CREATE POLICY "Enable read access for all users" ON recruitment_agencies
  FOR SELECT USING (true);

-- RECRUITMENT_PROJECTS - Public read
CREATE POLICY "Enable read access for all users" ON recruitment_projects
  FOR SELECT USING (true);

-- RECRUITMENT_AGENCY_STAFF - Public read
CREATE POLICY "Enable read access for all users" ON recruitment_agency_staff
  FOR SELECT USING (true);

-- USERS - Public read
CREATE POLICY "Enable read access for all users" ON users
  FOR SELECT USING (true);

-- ============================================================================
-- STEP 4: INSERT SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Insert test companies
INSERT INTO companies (name, description, website, logo_url) VALUES
  ('Tech Company Tanzania', 'A leading tech company in Tanzania', 'https://techcompany.tz', NULL),
  ('Finance Solutions', 'Financial services company', 'https://finance.tz', NULL),
  ('Healthcare Plus', 'Healthcare and medical services', 'https://healthcare.tz', NULL)
ON CONFLICT DO NOTHING;

-- Insert test jobs
INSERT INTO jobs (title, description, company_id, location, salary_min, salary_max) VALUES
  ('Senior Software Engineer', 'Full stack developer needed for web and mobile projects', 
   (SELECT id FROM companies WHERE name = 'Tech Company Tanzania' LIMIT 1), 
   'Dar es Salaam', 500000, 1000000),
  ('Product Manager', 'Manage product development and strategy', 
   (SELECT id FROM companies WHERE name = 'Tech Company Tanzania' LIMIT 1), 
   'Dar es Salaam', 400000, 800000),
  ('Data Analyst', 'Analyze and visualize company data', 
   (SELECT id FROM companies WHERE name = 'Finance Solutions' LIMIT 1), 
   'Dar es Salaam', 300000, 600000),
  ('Medical Doctor', 'General practitioner needed', 
   (SELECT id FROM companies WHERE name = 'Healthcare Plus' LIMIT 1), 
   'Dar es Salaam', 350000, 700000)
ON CONFLICT DO NOTHING;

-- Insert test institutions
INSERT INTO institutions (name, code, country) VALUES
  ('University of Dar es Salaam', 'UDSM', 'Tanzania'),
  ('Dar es Salaam University of Science and Technology', 'DUST', 'Tanzania'),
  ('Tanzania Institute of Accountancy', 'TIA', 'Tanzania'),
  ('Technical College of Arusha', 'TCA', 'Tanzania'),
  ('Mbeya University of Science and Technology', 'MUST', 'Tanzania')
ON CONFLICT DO NOTHING;

-- Insert test user (you'll need to update this with actual auth users)
INSERT INTO users (email, role) VALUES
  ('student@example.com', 'job_seeker'),
  ('recruiter@example.com', 'recruiter'),
  ('agency@example.com', 'agency_admin'),
  ('employer@example.com', 'employer')
ON CONFLICT DO NOTHING;

-- Insert test profiles
INSERT INTO profiles (user_id, full_name, bio) VALUES
  ((SELECT id FROM users WHERE email = 'student@example.com' LIMIT 1), 'John Doe', 'Software developer from Tanzania'),
  ((SELECT id FROM users WHERE email = 'recruiter@example.com' LIMIT 1), 'Jane Smith', 'Professional recruiter'),
  ((SELECT id FROM users WHERE email = 'agency@example.com' LIMIT 1), 'Agency Admin', 'Recruitment agency manager'),
  ((SELECT id FROM users WHERE email = 'employer@example.com' LIMIT 1), 'Company HR', 'Human resources manager')
ON CONFLICT DO NOTHING;

-- Insert test recruitment agency
INSERT INTO recruitment_agencies (user_id, name, description, website, verified) VALUES
  ((SELECT id FROM users WHERE email = 'agency@example.com' LIMIT 1), 'Top Talent Recruitment', 'Leading recruitment agency in East Africa', 'https://toptale nt.tz', true)
ON CONFLICT DO NOTHING;

-- Insert test recruitment projects
INSERT INTO recruitment_projects (agency_id, title, description, budget, status) VALUES
  ((SELECT id FROM recruitment_agencies LIMIT 1), 'Hire 50 Software Engineers', 'Mass recruitment for tech company', 50000000, 'open'),
  ((SELECT id FROM recruitment_agencies LIMIT 1), 'Executive Search', 'Find top management talent', 20000000, 'in_progress')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- END OF SQL SCRIPT
-- ============================================================================
-- 
-- INSTRUCTIONS:
-- 1. Copy all the SQL above
-- 2. Go to: https://app.supabase.com
-- 3. Select your project
-- 4. Click "SQL Editor" in the left sidebar
-- 5. Click "New Query"
-- 6. Paste ALL the SQL above
-- 7. Click "Run"
-- 8. Wait for completion
-- 9. Go to "Table Editor" to verify all tables are created
-- 10. Hard refresh your app and it should work!
--
-- ============================================================================
