package user

type updateProfileRequest struct {
	Name             string `json:"name"`
	JobTitle         string `json:"job_title"`
	Description      string `json:"description"`
	ResumeKey        string `json:"resume_key"`
	PrimaryResumeKey string `json:"primary_resume_key"`
}

type setPrimaryResumeRequest struct {
	ResumeKey string `json:"resume_key"`
}
