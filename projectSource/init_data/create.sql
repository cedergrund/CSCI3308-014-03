DROP TABLE IF EXISTS users;
CREATE TABLE users(
 username VARCHAR(50) PRIMARY KEY,
 email VARCHAR(50) NOT NULL,
 steam_id VARCHAR(50) NOT NULL,
 password CHAR(60) NOT NULL,
 country VARCHAR(50) NOT NULL
);

DROP TABLE IF EXISTS games;
CREATE TABLE games(
    appid INT PRIMARY KEY,
    name TEXT NOT NULL,
    release_date DATE,
    english BOOLEAN,
    developer TEXT,
    publisher TEXT,
    platforms TEXT,
    required_age SMALLINT,
    categories TEXT,
    genres TEXT,
    tags TEXT,
    achievements SMALLINT,
    positive_ratings INTEGER,
    negative_ratings INTEGER,
    average_playtime INTEGER,
    median_playtime INTEGER,
    owners TEXT,
    price DECIMAL
);

DROP TABLE IF EXISTS users_to_games;
CREATE TABLE users_to_games(
 username VARCHAR(50),
 appid INT,
 name VARCHAR(100),
 play_time INT,
 last_played INT
);

ALTER TABLE users_to_games
ADD CONSTRAINT username FOREIGN KEY (username) REFERENCES users (username);

ALTER TABLE users_to_games
ADD CONSTRAINT appid FOREIGN KEY (appid) REFERENCES games (appid);