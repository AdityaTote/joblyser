-- name: GetUserResume :one
SELECT resume_key
FROM profiles
WHERE user_id = $1;