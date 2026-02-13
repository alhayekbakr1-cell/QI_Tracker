-- Seed Faculty
INSERT INTO directory (name, email) VALUES
('Anna Hadid MD', 'Anna.Hadid.MD@AdventHealth.com'),
('Asha Ramsakal DO', 'Asha.Ramsakal.DO@AdventHealth.com'),
('Claudia Kroker-Bode MD', 'CLAUDIA.KROKERBODE.MD@AdventHealth.com'),
('Muhammad Anwar MD', 'Muhammad.Anwar.MD@AdventHealth.com'),
('Sara Bibi MD', 'Sara.Bibi.MD@AdventHealth.com'),
('Carlos SantosDeJesus MD', 'Carlos.SantosDeJesus.MD@AdventHealth.com'),
('Lidia SepulvedaRubiera MD', 'Lidia.SepulvedaRubiera.MD@AdventHealth.com'),
('Ryan Brink DO', 'Ryan.Brink.DO@AdventHealth.com'),
('RajaRamesh Gummalla MD', 'RajaRamesh.Gummalla.MD@AdventHealth.com'),
('Christopher Yanichko DO', 'Christopher.Yanichko.DO@AdventHealth.com'),
('Faheem Ahmad MD', 'Faheem.Ahmad.MD@AdventHealth.com'),
('Mounica Banala MD', 'Mounica.Banala.MD@AdventHealth.com'),
('James Vernace', 'James.Vernace@AdventHealth.com')
ON CONFLICT (name) DO UPDATE SET email = EXCLUDED.email;
