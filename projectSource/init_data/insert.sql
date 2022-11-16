INSERT INTO users (username, email, steam_id, password, country) VALUES
('abc', 'abc@gmail.com', '76561198358618132', '123', 'US'),
('aaa', 'aaa@gmail.com', '76561198284380594', '111', 'US');

COPY games
FROM '/data/steam.csv'
DELIMITER ','
CSV HEADER;