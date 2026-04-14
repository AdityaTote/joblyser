package agent

type runAgentRequest struct {
	Action    string `json:"action"`
	UserQuery string `json:"user_query"`
	JdText    string `json:"jd_text"`
	DocKey    string `json:"doc_key"`
	SessionId string `json:"session_id"`
}

type ragRetrievalRequest struct {
	DocumentType string `json:"document_type"`
	UserQuery    string `json:"user_query"`
	Key          string `json:"key"`
}

type editChatRequest struct {
	SessionId  string `json:"session_id"`
	EditedText string `json:"edited_text"`
}
