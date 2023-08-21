DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS ducks;
DROP TABLE IF EXISTS finds;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email TEXT,
    username VARCHAR(30),
    password_hash VARCHAR(60),
    permissions SMALLINT,
    finds INT,
    first_finds INT,
    verification_id VARCHAR(36) NULL,
    verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMP NULL,
    reset_id VARCHAR(36) NULL,
    reset_date TIMESTAMP NULL
);

CREATE TABLE ducks (
    id SERIAL PRIMARY KEY,
    duck_key VARCHAR(10),
    location_description TEXT,
    date_placed TIMESTAMP,
    first_user INT NULL DEFAULT NULL,
    obtainable BOOLEAN DEFAULT TRUE,
);

CREATE TABLE finds (
    id SERIAL PRIMARY KEY,
    duck_id INT,
    user_id INT,
    find_date TIMESTAMP
);