INSERT INTO users (username, email, password) VALUES
('abc', 'abc@gmail.com', '123'),
('aaa', 'abc@gmail.com', '111');

COPY games
FROM '/data/steam.csv'
DELIMITER ','
CSV HEADER;