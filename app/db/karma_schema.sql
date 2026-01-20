-- Nexus Karma Gamification Schema

-- ============================================================================
-- BADGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS badges (
    badge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon_name VARCHAR(50), -- Lucide icon name or URL
    criteria JSONB, -- Flexible criteria storage
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- KARMA POINTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS karma_points (
    point_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(student_id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    reason VARCHAR(255),
    awarded_by UUID, -- Optional reference to staff
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_karma_student ON karma_points(student_id);

-- ============================================================================
-- STUDENT BADGES (Many-to-Many)
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_badges (
    student_id UUID REFERENCES students(student_id) ON DELETE CASCADE,
    badge_id UUID REFERENCES badges(badge_id) ON DELETE CASCADE,
    awarded_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (student_id, badge_id)
);

-- Note: We can create a view for total points for easier querying
CREATE OR REPLACE VIEW v_student_karma AS
SELECT 
    s.student_id,
    s.full_name,
    s.admission_number,
    COALESCE(SUM(kp.points), 0) as total_points,
    COUNT(DISTINCT sb.badge_id) as total_badges
FROM students s
LEFT JOIN karma_points kp ON s.student_id = kp.student_id
LEFT JOIN student_badges sb ON s.student_id = sb.student_id
GROUP BY s.student_id, s.full_name, s.admission_number;
