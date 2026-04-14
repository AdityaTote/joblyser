-- name: CreateUserByCredential :one
INSERT INTO users(email, password)
VALUES ($1, $2)
RETURNING *;

-- name: CreateProfile :one
INSERT INTO profiles(user_id, name)
VALUES ($1, $2)
ON CONFLICT (user_id)
DO UPDATE SET
  name = COALESCE(EXCLUDED.name, profiles.name),
  updated_at = CURRENT_TIMESTAMP
RETURNING *;

-- name: GetUserByEmail :one
SELECT *
FROM users
WHERE email = $1;

-- name: GetUserById :one
SELECT *
FROM users
WHERE id = $1;

-- name: CreateUserByGoogle :one
INSERT INTO users(email, access_token, refresh_token)
VALUES ($1, $2, $3)
ON CONFLICT(email)
DO UPDATE SET
  access_token = EXCLUDED.access_token
RETURNING *;