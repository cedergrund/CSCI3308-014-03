INSERT INTO users (username, email, steam_id, password, country, time_created) VALUES
('abc', 'abc@gmail.com', '76561197960434622', '123', 'US', '0'),
('aaa', 'aaa@gmail.com', '76561197960434622', '111', 'US', '0'),
('Funkaro', 'funkaro@gmail.com', '76561198249589172', 'pwd', 'JP', '1441908587'),
('Franklin', 'franklin@gmail.com', '76561198330762498', 'pwd', 'BA', '1473720122'),
('Raku', 'raku@gmail.com', '76561198355539488', 'pwd', 'UK', '1483312353'),
('Turboaxe', 'turboaxe@gmail.com', '76561198055212268', 'pwd', 'US','1324697768'),
('Chamberchino', 'chamberchino@gmail.com', '76561198249026856', 'pwd', 'CN','1441564125'),
('elias', 'elias@gmail.com', '76561198211259228', 'pwd', 'CA','1423776221'),
('walter', 'walter@gmail.com', '76561198994029278', 'pwd', 'FR','1569856823'),
('Mertoqles', 'mertoqles@gmail.com', '76561198102643846', 'pwd', 'TR','1376339072'),
('Igor1390', 'Igor1390@gmail.com', '76561198131804303', 'pwd', 'UA','1396373367');

COPY games
FROM '/data/steam.csv'
DELIMITER ','
CSV HEADER;

