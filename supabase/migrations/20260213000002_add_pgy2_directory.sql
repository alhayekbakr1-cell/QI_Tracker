-- Seed PGY2 class
INSERT INTO directory (name, email) VALUES
('Ali Mashadi MD', 'Ali.Mashadi.MD@AdventHealth.com'),
('Ariba Khan MD', 'Ariba.Khan.MD@AdventHealth.com'),
('Bakr Alhayek MD', 'Bakr.Alhayek.MD@AdventHealth.com'),
('Ben Baang MD', 'Ben.Baang.MD@AdventHealth.com'),
('Bilal Khan MD', 'Bilal.Khan.MD@AdventHealth.com'),
('Hamood Chaudhry MD', 'Hamood.Chaudhry.MD@AdventHealth.com'),
('Iktimal Alwan MD', 'Iktimal.Alwan.MD@AdventHealth.com'),
('Jahid Wahabzai MD', 'Jahid.Wahabzai.MD@AdventHealth.com'),
('Muhammad Ahmad MD', 'Muhammad.Ahmad.MD@AdventHealth.com'),
('Muhammad Umair MD', 'Muhammad.Umair.MD@AdventHealth.com'),
('Muhammad Umar MD', 'Muhammad.Umar@AdventHealth.com'),
('Sahil Raj MD', 'Sahil.Raj.MD@AdventHealth.com'),
('Xiaowei Malone DO', 'Xiaowei.Malone.DO@AdventHealth.com')
ON CONFLICT (name) DO UPDATE SET email = EXCLUDED.email;
