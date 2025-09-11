-- Persona Configs schema
CREATE TABLE persona_configs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    config JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
