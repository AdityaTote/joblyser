package google_lib

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
)

type AuthClient struct {
	ClientID     string
	ClientSecret string
	RedirectURI  string
	Scopes       []string
	HTTPClient   *http.Client
}

type StateParams struct {
	SessionId int64
}

func New(cfg AuthClient) *AuthClient {
	return &AuthClient{
		ClientID:     cfg.ClientID,
		ClientSecret: cfg.ClientSecret,
		RedirectURI:  cfg.RedirectURI,
		Scopes:       cfg.Scopes,
		HTTPClient:   cfg.HTTPClient,
	}
}

func (c *AuthClient) GetAuthURI(state StateParams) string {
	params := buildParams([]params{
		{Key: "client_id", Value: c.ClientID},
		{Key: "redirect_uri", Value: c.RedirectURI},
		{Key: "response_type", Value: "code"},
		{Key: "scope", Value: strings.Join(c.Scopes, " ")},
		{Key: "access_type", Value: "offline"},
		{Key: "state", Value: state},
	})
	return "https://accounts.google.com/o/oauth2/v2/auth?" + params
}

func (c *AuthClient) GetAccessToken(code string) (*googleTokenResponse, error) {
	params := buildParams([]params{
		{Key: "client_id", Value: c.ClientID},
		{Key: "client_secret", Value: c.ClientSecret},
		{Key: "code", Value: code},
		{Key: "redirect_uri", Value: c.RedirectURI},
		{Key: "grant_type", Value: "authorization_code"},
	})

	res, err := c.HTTPClient.Post("https://oauth2.googleapis.com/token", "application/x-www-form-urlencoded", bytes.NewBufferString(params))
	if err != nil {
		return nil, fmt.Errorf("Failed to get access token: %v", err)
	}

	defer res.Body.Close()

	var data googleTokenResponse

	if err := json.NewDecoder(res.Body).Decode(&data); err != nil {
		return nil, err
	}

	return &data, nil
}

func (c *AuthClient) RefreshAccessToken(refreshToken string) (*googleTokenResponse, error) {
	params := buildParams([]params{
		{Key: "client_id", Value: c.ClientID},
		{Key: "client_secret", Value: c.ClientSecret},
		{Key: "refresh_token", Value: refreshToken},
		{Key: "grant_type", Value: "refresh_token"},
	})

	res, err := c.HTTPClient.Post("https://oauth2.googleapis.com/token", "application/x-www-form-urlencoded", bytes.NewBufferString(params))
	if err != nil {
		return nil, fmt.Errorf("Failed to refresh access token: %v", err)
	}

	defer res.Body.Close()

	var data googleTokenResponse

	if err := json.NewDecoder(res.Body).Decode(&data); err != nil {
		return nil, err
	}

	return &data, nil
}

func (c *AuthClient) RevokeToken(token string) error {
	params := buildParams([]params{
		{Key: "token", Value: token},
	})

	res, err := c.HTTPClient.Post("https://oauth2.googleapis.com/revoke", "application/x-www-form-urlencoded", bytes.NewBufferString(params))
	if err != nil {
		return fmt.Errorf("Failed to revoke token: %v", err)
	}

	defer res.Body.Close()

	return nil
}

func (c *AuthClient) GetUserInfo(accessToken string) (*googleUserInfoResponse, error) {

	req, err := http.NewRequest("GET", "https://www.googleapis.com/oauth2/v3/userinfo", nil)
	if err != nil {
		return nil, fmt.Errorf("failed to make google user info req: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)

	res, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to obtain user info from user: %w", err)
	}

	defer res.Body.Close()

	var data googleUserInfoResponse
	if err := json.NewDecoder(res.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("failed to decode the user info: %w", err)
	}

	return &data, nil

}
