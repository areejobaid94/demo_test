DROP TABLE IF EXISTS yelp;

CREATE TABLE yelp (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    img VARCHAR(255)
);
SELECT * FROM yelp;