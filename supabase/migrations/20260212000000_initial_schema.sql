-- Initial Schema for QI Project Tracker

-- Enums
CREATE TYPE project_status AS ENUM ('Idea', 'Pre-Intervention', 'Intervention Ongoing', 'Sustain the Gains');
CREATE TYPE user_role AS ENUM ('Operator', 'Viewer');
CREATE TYPE resource_type AS ENUM ('Checklist', 'Concept', 'Link');

-- Profiles Table (to manage roles)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    role user_role DEFAULT 'Viewer' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects Table
CREATE TABLE projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    status project_status DEFAULT 'Idea' NOT NULL,
    title TEXT NOT NULL,
    category TEXT,
    subcategory TEXT,
    primary_outcome TEXT,
    pdsa_cycle NUMERIC DEFAULT 0,
    proponents TEXT[] DEFAULT '{}',
    lead_proponents TEXT[] DEFAULT '{}',
    faculty TEXT,
    updates_and_barriers TEXT,
    internal_notes TEXT, -- Visible only to Operators
    last_updated_date TIMESTAMPTZ DEFAULT NOW(), -- Represents the "Last Updated" metadata from Excel
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id),
    protocol_url TEXT,
    presentation_url TEXT
);

-- Comments Table
CREATE TABLE comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    is_resolved BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Metrics Table
CREATE TABLE metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    label TEXT NOT NULL,
    month DATE NOT NULL,
    value NUMERIC NOT NULL,
    pdsa_cycle_id NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resources Table
CREATE TABLE resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL, -- Markdown content
    type resource_type NOT NULL,
    url TEXT, -- For links
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Log Table
CREATE TABLE audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    field_name TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS)

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Policies

-- Profiles: Users can read all profiles, but only update their own
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

-- Projects:
-- Viewers can read all projects
CREATE POLICY "Anyone can view projects" ON projects FOR SELECT USING (true);
-- Operators can insert/update/delete projects
CREATE POLICY "Operators can insert projects" ON projects FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Operator')
);
CREATE POLICY "Operators can update projects" ON projects FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Operator')
);
CREATE POLICY "Operators can delete projects" ON projects FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Operator')
);

-- Comments:
-- Anyone can view comments
CREATE POLICY "Anyone can view comments" ON comments FOR SELECT USING (true);
-- Anyone can insert comments
CREATE POLICY "Anyone can insert comments" ON comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
-- Operators can delete comments
CREATE POLICY "Operators can delete comments" ON comments FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Operator')
);

-- Metrics & Resources:
CREATE POLICY "Anyone can view metrics" ON metrics FOR SELECT USING (true);
CREATE POLICY "Anyone can view resources" ON resources FOR SELECT USING (true);
CREATE POLICY "Operators can manage metrics" ON metrics FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Operator')
);
CREATE POLICY "Operators can manage resources" ON resources FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Operator')
);

-- Audit Log:
CREATE POLICY "Anyone can view audit log" ON audit_log FOR SELECT USING (true);

-- Functions & Triggers

-- Trigger for updating `updated_at` and `last_updated_date` on projects
CREATE OR REPLACE FUNCTION update_project_modified_date()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.last_updated_date = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_modified_date
BEFORE UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION update_project_modified_date();

-- Trigger for Audit Logging (simplified example)
CREATE OR REPLACE FUNCTION log_project_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO audit_log (project_id, user_id, field_name, old_value, new_value)
        VALUES (NEW.id, auth.uid(), 'status', OLD.status::text, NEW.status::text);
    END IF;
    -- Add more fields as needed or a generic loop
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_project_status_changes
AFTER UPDATE ON projects
FOR EACH ROW
EXECUTE FUNCTION log_project_changes();
