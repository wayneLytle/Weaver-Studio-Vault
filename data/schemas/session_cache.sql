-- Session Cache schema
CREATE TABLE session_cache (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    session_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
