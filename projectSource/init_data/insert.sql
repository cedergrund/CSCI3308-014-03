INSERT INTO users (username, email, steam_id, password) VALUES
('abc', 'abc@gmail.com', '76561197960435530', '123'),
('aaa', 'aaa@gmail.com', '76561197960435530', '111'),
('bbb', 'aaa@gmail.com', '76561197977933423', '111');

COPY games
FROM '/data/steam.csv'
DELIMITER ','
CSV HEADER;