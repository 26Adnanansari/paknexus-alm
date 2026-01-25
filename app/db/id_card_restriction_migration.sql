-- ============================================================================
-- ID CARD RESTRICTION & APPEAL SYSTEM MIGRATION
-- Date: 2026-01-25
-- Purpose: Add ID card generation, edit restriction, and appeal workflow
-- ============================================================================

-- ============================================================================
-- 1. CREATE STUDENT ID CARDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_id_cards (
    card_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(student_id) ON DELETE CASCADE,
    
    -- Card Details
    card_number VARCHAR(50) UNIQUE NOT NULL,
    qr_code_url TEXT,
    issue_date DATE DEFAULT CURRENT_DATE,
    expiry_date DATE,
    
    -- Edit Restriction & Status Tracking
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'locked', 'appeal_pending', 'unlocked_for_edit')),
    submission_count INTEGER DEFAULT 0,
    last_submitted_at TIMESTAMPTZ,
    is_editable BOOLEAN DEFAULT TRUE,
    
    -- Appeal Information
    appeal_reason TEXT,
    appeal_submitted_at TIMESTAMPTZ,
    unlocked_by_admin_id UUID REFERENCES staff(staff_id),
    unlocked_at TIMESTAMPTZ,
    
    -- Audit Trail
    edit_history JSONB DEFAULT '[]'::jsonb,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(student_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_id_cards_status ON student_id_cards(status);
CREATE INDEX IF NOT EXISTS idx_id_cards_editable ON student_id_cards(is_editable);
CREATE INDEX IF NOT EXISTS idx_id_cards_student ON student_id_cards(student_id);
CREATE INDEX IF NOT EXISTS idx_id_cards_card_number ON student_id_cards(card_number);

-- ============================================================================
-- 2. CREATE ID CARD APPEALS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS id_card_appeals (
    appeal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(student_id) ON DELETE CASCADE,
    card_id UUID REFERENCES student_id_cards(card_id) ON DELETE CASCADE,
    
    -- Appeal Details
    appeal_reason TEXT NOT NULL,
    mistake_description TEXT NOT NULL,
    requested_changes JSONB,
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    
    -- Review Information
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_by UUID REFERENCES staff(staff_id),
    reviewed_at TIMESTAMPTZ,
    admin_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_appeals_status ON id_card_appeals(status);
CREATE INDEX IF NOT EXISTS idx_appeals_student ON id_card_appeals(student_id);
CREATE INDEX IF NOT EXISTS idx_appeals_card ON id_card_appeals(card_id);
CREATE INDEX IF NOT EXISTS idx_appeals_submitted ON id_card_appeals(submitted_at DESC);

-- ============================================================================
-- 3. CREATE ID CARD TEMPLATES TABLE (Optional - for custom designs)
-- ============================================================================
CREATE TABLE IF NOT EXISTS id_card_templates (
    template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name VARCHAR(100) NOT NULL,
    layout_json JSONB NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. CREATE TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for student_id_cards
DROP TRIGGER IF EXISTS update_student_id_cards_updated_at ON student_id_cards;
CREATE TRIGGER update_student_id_cards_updated_at
    BEFORE UPDATE ON student_id_cards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for id_card_appeals
DROP TRIGGER IF EXISTS update_id_card_appeals_updated_at ON id_card_appeals;
CREATE TRIGGER update_id_card_appeals_updated_at
    BEFORE UPDATE ON id_card_appeals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for id_card_templates
DROP TRIGGER IF EXISTS update_id_card_templates_updated_at ON id_card_templates;
CREATE TRIGGER update_id_card_templates_updated_at
    BEFORE UPDATE ON id_card_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. CREATE VIEWS FOR REPORTING
-- ============================================================================

-- View: Pending Appeals Dashboard
CREATE OR REPLACE VIEW v_pending_appeals AS
SELECT 
    a.appeal_id,
    a.student_id,
    s.full_name,
    s.admission_number,
    s.current_class,
    a.appeal_reason,
    a.mistake_description,
    a.submitted_at,
    c.status AS card_status,
    c.submission_count,
    EXTRACT(EPOCH FROM (NOW() - a.submitted_at))/3600 AS hours_pending
FROM id_card_appeals a
JOIN students s ON a.student_id = s.student_id
JOIN student_id_cards c ON a.card_id = c.card_id
WHERE a.status = 'pending'
ORDER BY a.submitted_at ASC;

-- View: ID Card Statistics
CREATE OR REPLACE VIEW v_id_card_stats AS
SELECT 
    COUNT(*) FILTER (WHERE status = 'draft') AS draft_count,
    COUNT(*) FILTER (WHERE status = 'submitted') AS submitted_count,
    COUNT(*) FILTER (WHERE status = 'locked') AS locked_count,
    COUNT(*) FILTER (WHERE status = 'appeal_pending') AS appeal_pending_count,
    COUNT(*) FILTER (WHERE status = 'unlocked_for_edit') AS unlocked_count,
    COUNT(*) AS total_cards,
    COUNT(*) FILTER (WHERE is_editable = TRUE) AS editable_count,
    COUNT(*) FILTER (WHERE is_editable = FALSE) AS locked_count_total
FROM student_id_cards;

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE student_id_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE id_card_appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE id_card_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies (to be customized based on authentication system)
-- Example: Students can only see their own ID cards
-- CREATE POLICY "Students see own cards" ON student_id_cards
--     FOR SELECT
--     USING (student_id = auth.uid());

-- Example: Only admins can approve appeals
-- CREATE POLICY "Admins manage appeals" ON id_card_appeals
--     FOR ALL
--     USING (auth.role() = 'admin');

-- ============================================================================
-- 7. HELPER FUNCTIONS
-- ============================================================================

-- Function to generate unique card number
CREATE OR REPLACE FUNCTION generate_card_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    new_number VARCHAR(50);
    counter INTEGER := 1;
BEGIN
    LOOP
        new_number := 'IDC-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(counter::TEXT, 6, '0');
        
        -- Check if number exists
        IF NOT EXISTS (SELECT 1 FROM student_id_cards WHERE card_number = new_number) THEN
            RETURN new_number;
        END IF;
        
        counter := counter + 1;
        
        -- Safety limit
        IF counter > 999999 THEN
            RAISE EXCEPTION 'Card number generation limit reached';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-create ID card when student is added
CREATE OR REPLACE FUNCTION auto_create_id_card()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO student_id_cards (student_id, card_number, issue_date, expiry_date)
    VALUES (
        NEW.student_id,
        generate_card_number(),
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '3 years'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-create ID card for new students
DROP TRIGGER IF EXISTS trigger_auto_create_id_card ON students;
CREATE TRIGGER trigger_auto_create_id_card
    AFTER INSERT ON students
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_id_card();

-- ============================================================================
-- 8. SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Insert default template
INSERT INTO id_card_templates (template_name, layout_json, is_default, is_active)
VALUES (
    'Default School ID Card',
    '{
        "layout": "standard",
        "fields": ["photo", "name", "admission_number", "class", "qr_code"],
        "colors": {
            "primary": "#1e40af",
            "secondary": "#3b82f6",
            "text": "#1f2937"
        },
        "logo_position": "top-center",
        "qr_position": "bottom-right"
    }'::jsonb,
    TRUE,
    TRUE
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify tables created
DO $$
BEGIN
    RAISE NOTICE 'ID Card Restriction Migration Completed Successfully!';
    RAISE NOTICE 'Tables Created: student_id_cards, id_card_appeals, id_card_templates';
    RAISE NOTICE 'Views Created: v_pending_appeals, v_id_card_stats';
    RAISE NOTICE 'Triggers: Auto-create ID cards for new students';
END $$;
