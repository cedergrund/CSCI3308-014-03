INSERT INTO users (username, email, steam_id, password, country) VALUES
('abc', 'abc@gmail.com', '76561198358618132', '123', 'US'),
('aaa', 'aaa@gmail.com', '76561198284380594', '111', 'US'),
('Funkaro', 'funkaro@gmail.com', '76561198249589172', 'pwd', 'JP'),
('Franklin', 'franklin@gmail.com', '76561198330762498', 'pwd', 'BA'),
('Raku', 'raku@gmail.com', '76561198355539488', 'pwd', 'UK'),
('Turboaxe', 'turboaxe@gmail.com', '76561198055212268', 'pwd', 'US'),
('Chamberchino', 'chamberchino@gmail.com', '76561198249026856', 'pwd', 'CN'),
('elias', 'elias@gmail.com', '76561198211259228', 'pwd', 'CA'),
('walter', 'walter@gmail.com', '76561198994029278', 'pwd', 'FR'),
('Mertoqles', 'mertoqles@gmail.com', '76561198102643846', 'pwd', 'TR'),
('Igor1390', 'Igor1390@gmail.com', '76561198131804303', 'pwd', 'UA');

COPY games
FROM '/data/steam.csv'
DELIMITER ','
CSV HEADER;

