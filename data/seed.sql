DROP TABLE IF EXISTS seed;

CREATE TABLE seed (
  id SERIAL PRIMARY KEY,
  title VARCHAR(256),
  authors VARCHAR(256),
  description TEXT,
  image TEXT,
  isbn VARCHAR(256),
  category VARCHAR(256)
);
