package user

import "github.com/google/uuid"

type updateProfileData struct {
	profileId        uuid.UUID
	userId           uuid.UUID
	name             string
	jobTitle         string
	description      string
	resumeKey        string
	primaryResumeKey string
}
