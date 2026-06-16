-- Migration 053: Course system
-- Courses → Modules → Lessons → Progress + Submissions + Certificates

-- 1. ENUMS
DO $$ BEGIN
  CREATE TYPE lesson_type AS ENUM ('theory', 'practice', 'quiz', 'mixed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE lesson_status AS ENUM ('locked', 'available', 'viewed', 'submitted', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE submission_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. COURSES
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  tier TEXT NOT NULL DEFAULT 'prana', -- which subscription tier
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  estimated_hours INT, -- estimated duration
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. COURSE MODULES (weeks/sections)
CREATE TABLE IF NOT EXISTS course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. COURSE LESSONS
CREATE TABLE IF NOT EXISTS course_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  lesson_type lesson_type NOT NULL DEFAULT 'theory',
  video_url TEXT, -- for theory/practice lessons
  video_duration INT, -- seconds
  content TEXT, -- markdown text for theory
  quiz_data JSONB, -- for quiz type: { questions: [{ q, options[], correct }] }
  max_demo_duration INT NOT NULL DEFAULT 900, -- 15 min in seconds
  sort_order INT NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT true, -- must complete to advance
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. USER PROGRESS per lesson
CREATE TABLE IF NOT EXISTS course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
  status lesson_status NOT NULL DEFAULT 'locked',
  video_watch_time INT DEFAULT 0, -- seconds watched
  quiz_score INT, -- percentage if quiz
  quiz_passed BOOLEAN,
  viewed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  feedback TEXT, -- admin feedback on approval/rejection
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- 6. SUBMISSIONS (demo videos from users)
CREATE TABLE IF NOT EXISTS course_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  video_duration INT, -- detected duration
  title TEXT,
  notes TEXT,
  status submission_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. CERTIFICATES
CREATE TABLE IF NOT EXISTS course_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  certificate_number TEXT UNIQUE,
  UNIQUE(user_id, course_id)
);

-- 8. INDEXES
CREATE INDEX IF NOT EXISTS idx_course_modules_course ON course_modules(course_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_course_lessons_module ON course_lessons(module_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_course_progress_user ON course_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_course_progress_lesson ON course_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_course_submissions_user ON course_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_course_submissions_status ON course_submissions(status);
CREATE INDEX IF NOT EXISTS idx_course_certificates_user ON course_certificates(user_id);

-- 9. RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_certificates ENABLE ROW LEVEL SECURITY;

-- Courses: everyone can read active, admin can manage
DO $$ BEGIN
  DROP POLICY IF EXISTS "courses_select" ON courses;
  CREATE POLICY "courses_select" ON courses FOR SELECT USING (is_active = true OR is_admin_user());
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "courses_admin" ON courses;
  CREATE POLICY "courses_admin" ON courses FOR ALL USING (is_admin_user());
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Modules: same as courses
DO $$ BEGIN
  DROP POLICY IF EXISTS "modules_select" ON course_modules;
  CREATE POLICY "modules_select" ON course_modules FOR SELECT USING (
    EXISTS (SELECT 1 FROM courses WHERE id = course_id AND (is_active = true OR is_admin_user()))
  );
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "modules_admin" ON course_modules;
  CREATE POLICY "modules_admin" ON course_modules FOR ALL USING (is_admin_user());
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Lessons: same as modules
DO $$ BEGIN
  DROP POLICY IF EXISTS "lessons_select" ON course_lessons;
  CREATE POLICY "lessons_select" ON course_lessons FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM course_modules m JOIN courses c ON c.id = m.course_id
      WHERE m.id = module_id AND (c.is_active = true OR is_admin_user())
    )
  );
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "lessons_admin" ON course_lessons;
  CREATE POLICY "lessons_admin" ON course_lessons FOR ALL USING (is_admin_user());
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Progress: users see their own, admin sees all
DO $$ BEGIN
  DROP POLICY IF EXISTS "progress_select" ON course_progress;
  CREATE POLICY "progress_select" ON course_progress FOR SELECT USING (
    auth.uid() = user_id OR is_admin_user()
  );
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "progress_insert" ON course_progress;
  CREATE POLICY "progress_insert" ON course_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "progress_update" ON course_progress;
  CREATE POLICY "progress_update" ON course_progress FOR UPDATE USING (
    auth.uid() = user_id OR is_admin_user()
  );
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Submissions: users see their own + insert, admin sees all
DO $$ BEGIN
  DROP POLICY IF EXISTS "submissions_select" ON course_submissions;
  CREATE POLICY "submissions_select" ON course_submissions FOR SELECT USING (
    auth.uid() = user_id OR is_admin_user()
  );
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "submissions_insert" ON course_submissions;
  CREATE POLICY "submissions_insert" ON course_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "submissions_update" ON course_submissions;
  CREATE POLICY "submissions_update" ON course_submissions FOR UPDATE USING (is_admin_user());
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Certificates: users see their own, admin sees all
DO $$ BEGIN
  DROP POLICY IF EXISTS "certificates_select" ON course_certificates;
  CREATE POLICY "certificates_select" ON course_certificates FOR SELECT USING (
    auth.uid() = user_id OR is_admin_user()
  );
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "certificates_admin" ON course_certificates;
  CREATE POLICY "certificates_admin" ON course_certificates FOR ALL USING (is_admin_user());
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- 10. RPC: Initialize course progress for a user
CREATE OR REPLACE FUNCTION initialize_course_progress(p_user_id UUID, p_course_id UUID)
RETURNS void AS $$
DECLARE
  mod RECORD;
  lesson RECORD;
  first_lesson UUID;
  found_first BOOLEAN := false;
BEGIN
  FOR mod IN SELECT id FROM course_modules WHERE course_id = p_course_id AND is_active = true ORDER BY sort_order LOOP
    FOR lesson IN SELECT id FROM course_lessons WHERE module_id = mod.id AND is_active = true ORDER BY sort_order LOOP
      IF NOT found_first THEN
        first_lesson := lesson.id;
        found_first := true;
        INSERT INTO course_progress (user_id, lesson_id, status)
        VALUES (p_user_id, lesson.id, 'available')
        ON CONFLICT (user_id, lesson_id) DO NOTHING;
      ELSE
        INSERT INTO course_progress (user_id, lesson_id, status)
        VALUES (p_user_id, lesson.id, 'locked')
        ON CONFLICT (user_id, lesson_id) DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. RPC: Approve lesson and unlock next
CREATE OR REPLACE FUNCTION approve_lesson(p_user_id UUID, p_lesson_id UUID, p_approved_by UUID, p_feedback TEXT DEFAULT NULL)
RETURNS void AS $$
DECLARE
  next_lesson RECORD;
  current_module RECORD;
  next_module RECORD;
  all_done BOOLEAN;
BEGIN
  -- Mark current as approved
  UPDATE course_progress
  SET status = 'approved', approved_at = now(), approved_by = p_approved_by, feedback = p_feedback, updated_at = now()
  WHERE user_id = p_user_id AND lesson_id = p_lesson_id;

  -- Find next lesson in same module
  SELECT l.id INTO next_lesson
  FROM course_lessons l
  WHERE l.module_id = (SELECT module_id FROM course_lessons WHERE id = p_lesson_id)
    AND l.is_active = true
    AND l.sort_order > (SELECT sort_order FROM course_lessons WHERE id = p_lesson_id)
  ORDER BY l.sort_order
  LIMIT 1;

  IF next_lesson.id IS NOT NULL THEN
    INSERT INTO course_progress (user_id, lesson_id, status)
    VALUES (p_user_id, next_lesson.id, 'available')
    ON CONFLICT (user_id, lesson_id) DO UPDATE SET
      status = CASE WHEN course_progress.status = 'locked' THEN 'available' ELSE course_progress.status END,
      updated_at = now();
  ELSE
    -- Module complete, find first lesson of next module
    SELECT cm.id INTO next_module
    FROM course_modules cm
    WHERE cm.course_id = (SELECT c.course_id FROM course_modules c WHERE c.id = (SELECT module_id FROM course_lessons WHERE id = p_lesson_id))
      AND cm.is_active = true
      AND cm.sort_order > (SELECT sort_order FROM course_modules WHERE id = (SELECT module_id FROM course_lessons WHERE id = p_lesson_id))
    ORDER BY cm.sort_order
    LIMIT 1;

    IF next_module.id IS NOT NULL THEN
      SELECT l.id INTO next_lesson
      FROM course_lessons l
      WHERE l.module_id = next_module.id AND l.is_active = true
      ORDER BY l.sort_order
      LIMIT 1;

      IF next_lesson.id IS NOT NULL THEN
        INSERT INTO course_progress (user_id, lesson_id, status)
        VALUES (p_user_id, next_lesson.id, 'available')
        ON CONFLICT (user_id, lesson_id) DO UPDATE SET
          status = CASE WHEN course_progress.status = 'locked' THEN 'available' ELSE course_progress.status END,
          updated_at = now();
      END IF;
    END IF;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
