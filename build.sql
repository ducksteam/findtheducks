DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS ducks;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS finds;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(99),
    username VARCHAR(20),
    password_hash VARCHAR(60),
    permissions SMALLINT
);

CREATE TABLE ducks (
    id SERIAL PRIMARY KEY,
    duck_key VARCHAR(10),
    location_description TEXT,
    date_placed TIMESTAMP
);

CREATE TABLE sessions (
    session_id VARCHAR(25) PRIMARY KEY,
    user_id INT,
    expiry TIMESTAMP
);

CREATE TABLE finds (
    id SERIAL PRIMARY KEY,
    duck_id INT,
    user_id INT,
    find_date TIMESTAMP
);