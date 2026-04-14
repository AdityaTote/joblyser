-- name: CreateDocument :one
INSERT INTO documents (key, user_id)
VALUES ($1, $2)
RETURNING *;

-- name: GetDocumentById :one
SELECT *
FROM documents
WHERE id = $1;

-- name: GetDocumentByUserAndId :one
SELECT *
FROM documents
WHERE id = $1 AND user_id = $2;

-- name: GetDocumentByUserId :many
SELECT *
FROM documents
WHERE user_id = $1
ORDER BY
  CASE WHEN $4 = 'asc'  THEN created_at END ASC,
  CASE WHEN $4 = 'desc' THEN created_at END DESC,
  created_at DESC
LIMIT COALESCE($2, 5)
OFFSET COALESCE($3, 0);

-- name: DeleteDocument :one
DELETE FROM documents
WHERE id = $1 and user_id = $2
RETURNING *;