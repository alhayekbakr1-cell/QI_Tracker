-- Create directory table to map names to emails
CREATE TABLE directory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed PGY3 class
INSERT INTO directory (name, email) VALUES
('Abdalla MD, Mahmoud', 'mahmoud.abdalla.md@adventhealth.com'),
('Ahmad MD, Anees', 'anees.ahmad@adventhealth.com'),
('Anjum MD, Mahnoor', 'mahnoor.anjum.md@adventhealth.com'),
('Bhamber MD, Tiagpaul', 'tiagpaul.bhamber.md@adventhealth.com'),
('Kayani MD, AbdulMueezAlam', 'abdulmueezalam.kayani.md@adventhealth.com'),
('Khan MD, Nasar', 'nasar.khan.md@adventhealth.com'),
('Maheshwari MD, RohitKumar', 'rohitkumar.maheshwari.md@adventhealth.com'),
('Mislay MD, JoelianAndrew', 'joelianandrew.mislay.md@adventhealth.com'),
('Naina MD, Fnu', 'fnu.naina.md@adventhealth.com'),
('Rashid MD, MuhammadAffan', 'muhammadaffan.rashid.md@adventhealth.com'),
('Reddy MD, Vipul', 'vipul.reddy.md@adventhealth.com'),
('Telleria DO, Orlando', 'orlando.telleria.do@adventhealth.com'),
('Waseem MD, Haniya', 'haniya.waseem.md@adventhealth.com')
ON CONFLICT (name) DO UPDATE SET email = EXCLUDED.email;

-- Enable RLS
ALTER TABLE directory ENABLE ROW LEVEL SECURITY;

-- Policies: Anyone authenticated can read the directory
CREATE POLICY "Profiles are viewable by everyone" ON directory FOR SELECT USING (true);
-- Only Operators can manage the directory
CREATE POLICY "Operators can manage directory" ON directory FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'Operator')
);
