package auth

import (
	"github.com/AdityaTote/joblyser/joblyser-api/internal/token"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

func hashPassword(password string) (string, error) {
	pass, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(pass), nil
}

func verifyPassword(hashpassword string, password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hashpassword), []byte(password))
	return err == nil
}

func signToken(accessSecret []byte, userId uuid.UUID) (string, error) {
	return token.SignToken(accessSecret, userId)
}

// ParseAccessToken is kept as a public re-export for any external callers.
func ParseAccessToken(accessSecret []byte, tokenStr string) (*token.AccessClaims, error) {
	return token.ParseAccessToken(accessSecret, tokenStr)
}

