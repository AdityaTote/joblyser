-- name: UpdateProfile :one
UPDATE profiles
SET 
  name = COALESCE($3, name),
  job_title = COALESCE($4, job_title),
  description = COALESCE($5, description),
  resume_key = COALESCE($6, resume_key),
  primary_resume_key = COALESCE($7, primary_resume_key)
WHERE id = $1 AND user_id = $2
RETURNING *;

-- name: GetUserById :one
SELECT id, email
FROM users
WHERE id = $1;

-- name: GetUserInformation :one
SELECT p.id AS profile_id, u.email, p.name, p.job_title, p.description, p.resume_key, p.primary_resume_key
FROM users u
JOIN profiles p
ON u.id = p.user_id
WHERE u.id = $1;

-- name: SetPrimaryResume :one
UPDATE profiles p
SET primary_resume_key = $2,
    resume_key = $2
WHERE p.user_id = $1
  AND EXISTS (
    SELECT 1
    FROM documents d
    WHERE d.user_id = $1
      AND d.key = $2
  )
RETURNING *;

-- name: DeleteUser :one
DELETE FROM users
WHERE id = $1
RETURNING *;

-- name: DeleteProfile :one
DELETE FROM profiles
WHERE user_id = $1
RETURNING *;