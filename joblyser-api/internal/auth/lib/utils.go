package google_lib

import (
	"fmt"
	"net/http"
	"net/url"
	"strconv"
)

/*
* Builds a URL-encoded query string from a slice of Params.
* args: params - slice of Params struct containing key-value pairs
* returns: URL-encoded query string
 */

type params struct {
	Key   string
	Value any
}

func buildParams(params []params) string {
	values := url.Values{}
	for _, p := range params {
		values.Set(p.Key, fmt.Sprintf("%v", p.Value))
	}
	return values.Encode()
}

/*
* Returns a pointer to either the key or value based on comparison with defaultValue.
* If key matches the address of defaultValue, returns key; otherwise returns a pointer to value.
* args: key - pointer to compare, defaultValue - value to compare against, value - alternative value to return
* returns: pointer to T
 */
func getValueOrDefault[T any](key *T, defaultValue T, value T) *T {
	if key == &defaultValue {
		return key
	}
	return &value
}

func getCodeAndState(r *http.Request) (string, int64, error) {
	code := r.PathValue("code")
	state, err := strconv.ParseInt(r.PathValue("state"), 10, 64)
	if err != nil {
		return "", 0, err
	}

	if code == "" && state == 0 {
		return "", 0, fmt.Errorf("authentication failed!")
	}

	return code, state, nil
}
