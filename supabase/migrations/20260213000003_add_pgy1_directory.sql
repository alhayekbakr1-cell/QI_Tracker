-- Seed PGY1 class
INSERT INTO directory (name, email) VALUES
('Amro Idilbi MD', 'Amro.Idilbi.MD@AdventHealth.com'),
('Aqsa Khan MD', 'Aqsa.Khan.MD@AdventHealth.com'),
('Aqsa Saleem MD', 'Aqsa.Saleem.MD@AdventHealth.com'),
('Diya Asad MD', 'Diya.Asad.MD@AdventHealth.com'),
('JoaoVictor SouzaPeres DO', 'JoaoVictor.SouzaPeres.DO@AdventHealth.com'),
('John Haffey DO', 'John.Haffey.DO@AdventHealth.com'),
('Lidetu Kayamo MD', 'Lidetu.Kayamo.MD@AdventHealth.com'),
('NagaManeesh Komireddy MD', 'NagaManeesh.Komireddy.MD@AdventHealth.com'),
('Ramish Rafay MD', 'Ramish.Rafay.MD@AdventHealth.com'),
('Rebekah Alison DO', 'Rebekah.Alison.DO@AdventHealth.com'),
('Reynaldo ReynosoFigueroa MD', 'Reynaldo.ReynosoFigueroa.MD@AdventHealth.com'),
('Rizwan Khawaja DO', 'Rizwan.Khawaja.DO@AdventHealth.com'),
('Yaseen Dhemesh MD', 'Yaseen.Dhemesh.MD@AdventHealth.com')
ON CONFLICT (name) DO UPDATE SET email = EXCLUDED.email;
