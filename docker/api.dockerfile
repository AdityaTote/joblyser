FROM cgr.dev/chainguard/go:latest-dev AS deps

WORKDIR /src

COPY ./joblyser-api/go.mod ./joblyser-api/go.sum ./
RUN go mod download && go mod verify

FROM deps AS builder

WORKDIR /src

COPY ./joblyser-api/ ./

ARG TARGETOS=linux
ARG TARGETARCH=amd64

RUN CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} \
	go build -trimpath -ldflags="-s -w" -o /out/joblyser-api ./cmd/joblyser-api

FROM gcr.io/distroless/static-debian12:nonroot AS runtime

COPY --from=builder /out/joblyser-api /usr/local/bin/joblyser-api

EXPOSE 8081

ENTRYPOINT ["/usr/local/bin/joblyser-api"]