-- ============================================================================
-- TALENTA-TZ COMPLETE SQL SCRIPT (CLEAN START)
-- This script drops existing tables and recreates them correctly
-- ============================================================================

-- ============================================================================
-- STEP 0: DROP EXISTING TABLES (if they exist)
-- ============================================================================

DROP TABLE IF EXISTS recruitment_agency_staff CASCADE;
DROP TABLE IF EXISTS recruitment_projects CASCADE;
DROP TABLE IF EXISTS recruitment_agencies CASCADE;
DROP TABLE IF EXISTS talent_showcases CASCADE;
DROP TABLE IF EXISTS student_verification_requests CASCADE;
DROP TABLE IF EXISTS institutions CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- STEP 1: CREATE ALL TABLES (FRESH)
-- ============================================================================

-- TABLE 1: USERS
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'job_seeker',
  created_at TIMESTAMP DEFAULT NOW()
);

-- TABLE 2: COMPANIES (NO owner_id constraint)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  logo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- TABLE 3: JOBS
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  company_id UUID,
  salary_min NUMERIC,
  salary_max NUMERIC,
  location TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- TABLE 4: PROFILES
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- TABLE 5: APPLICATIONS
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL,
  user_id UUID NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- TABLE 6: INSTITUTIONS (for V2)
CREATE TABLE institutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  country TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- TABLE 7: STUDENT_VERIFICATION_REQUESTS (for V2)
CREATE TABLE student_verification_requests (
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
CREATE TABLE talent_showcases (
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
CREATE TABLE recruitment_agencies (
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
CREATE TABLE recruitment_projects (
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
CREATE TABLE recruitment_agency_staff (
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

CREATE POLICY "Enable read access" ON users FOR SELECT USING (true);
CREATE POLICY "Enable read access" ON companies FOR SELECT USING (true);
CREATE POLICY "Enable read access" ON jobs FOR SELECT USING (true);
CREATE POLICY "Enable read access" ON profiles FOR SELECT USING (true);
CREATE POLICY "Enable read access" ON applications FOR SELECT USING (true);
CREATE POLICY "Enable read access" ON institutions FOR SELECT USING (true);
CREATE POLICY "Enable read access" ON student_verification_requests FOR SELECT USING (true);
CREATE POLICY "Enable read access" ON talent_showcases FOR SELECT USING (true);
CREATE POLICY "Enable read access" ON recruitment_agencies FOR SELECT USING (true);
CREATE POLICY "Enable read access" ON recruitment_projects FOR SELECT USING (true);
CREATE POLICY "Enable read access" ON recruitment_agency_staff FOR SELECT USING (true);

-- ============================================================================
-- STEP 4: INSERT SAMPLE DATA
-- ============================================================================

-- Insert test companies
INSERT INTO companies (name, description, website, logo_url) VALUES
  ('Tech Company Tanzania', 'A leading tech company in Tanzania', 'https://techcompany.tz', NULL),
  ('Finance Solutions', 'Financial services company', 'https://finance.tz', NULL),
  ('Healthcare Plus', 'Healthcare and medical services', 'https://healthcare.tz', NULL);

-- Insert test users
INSERT INTO users (email, role) VALUES
  ('student@example.com', 'job_seeker'),
  ('recruiter@example.com', 'recruiter'),
  ('agency@example.com', 'agency_admin'),
  ('employer@example.com', 'employer');

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
   'Dar es Salaam', 350000, 700000);

-- Insert test institutions
INSERT INTO institutions (name, code, country) VALUES
  ('University of Dar es Salaam', 'UDSM', 'Tanzania'),
  ('Dar es Salaam University of Science and Technology', 'DUST', 'Tanzania'),
  ('Tanzania Institute of Accountancy', 'TIA', 'Tanzania'),
  ('Technical College of Arusha', 'TCA', 'Tanzania'),
  ('Mbeya University of Science and Technology', 'MUST', 'Tanzania');

-- Insert test profiles
INSERT INTO profiles (user_id, full_name, bio) 
SELECT id, 'John Doe', 'Software developer from Tanzania' FROM users WHERE email = 'student@example.com';

INSERT INTO profiles (user_id, full_name, bio) 
SELECT id, 'Jane Smith', 'Professional recruiter' FROM users WHERE email = 'recruiter@example.com';

INSERT INTO profiles (user_id, full_name, bio) 
SELECT id, 'Agency Admin', 'Recruitment agency manager' FROM users WHERE email = 'agency@example.com';

INSERT INTO profiles (user_id, full_name, bio) 
SELECT id, 'Company HR', 'Human resources manager' FROM users WHERE email = 'employer@example.com';

-- Insert test recruitment agency
INSERT INTO recruitment_agencies (user_id, name, description, website, verified) 
SELECT id, 'Top Talent Recruitment', 'Leading recruitment agency in East Africa', 'https://toptalent.tz', true 
FROM users WHERE email = 'agency@example.com';

-- Insert test recruitment projects
INSERT INTO recruitment_projects (agency_id, title, description, budget, status) VALUES
  ((SELECT id FROM recruitment_agencies LIMIT 1), 'Hire 50 Software Engineers', 'Mass recruitment for tech company', 50000000, 'open'),
  ((SELECT id FROM recruitment_agencies LIMIT 1), 'Executive Search', 'Find top management talent', 20000000, 'in_progress');

-- ============================================================================
-- SUCCESS! All tables created and populated
-- ============================================================================
