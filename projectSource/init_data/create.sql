DROP TABLE IF EXISTS users;
CREATE TABLE users(
 username VARCHAR(50) PRIMARY KEY,
 email VARCHAR(50) NOT NULL,
 password CHAR(60) NOT NULL
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