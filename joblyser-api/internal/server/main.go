package server

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/AdityaTote/joblyser/joblyser-api/internal/agent"
	"github.com/AdityaTote/joblyser/joblyser-api/internal/auth"
	"github.com/AdityaTote/joblyser/joblyser-api/internal/config"
	"github.com/AdityaTote/joblyser/joblyser-api/internal/database"
	"github.com/AdityaTote/joblyser/joblyser-api/internal/document"
	"github.com/AdityaTote/joblyser/joblyser-api/internal/middleware"
	"github.com/AdityaTote/joblyser/joblyser-api/internal/user"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/rs/zerolog"
)

type App struct {
	httpServer *http.Server
	db         *database.Database
}

func New(cfg *config.Config, log zerolog.Logger) (*App, error) {
	ctx := context.Background()
	db, err := database.New(ctx, *cfg)
	if err != nil {
		return nil, fmt.Errorf("create database: %w", err)
	}

	r := chi.NewRouter()

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})
	
	v1 := chi.NewRouter()
	
	authRouter := chi.NewRouter()
	auth.RegisterRoutes(authRouter, log, cfg, db.Pool, middleware.AuthWithConfig(cfg, log))
	v1.Mount("/auth", authRouter)
	
	protected := chi.NewRouter()
	protected.Use(middleware.AuthWithConfig(cfg, log))
	
	agentRouter := chi.NewRouter()
	if err := agent.RegisterRoutes(agentRouter, log, cfg); err != nil {
		return nil, fmt.Errorf("register agent routes: %w", err)
	}
	protected.Mount("/agent", agentRouter)
	
	documentRouter := chi.NewRouter()
	if err := document.RegisterRoutes(documentRouter, log, cfg, db.Pool); err != nil {
		return nil, fmt.Errorf("register document routes: %w", err)
	}
	protected.Mount("/documents", documentRouter)
	
	userRouter := chi.NewRouter()
	if err := user.RegisterRoutes(userRouter, log, cfg, db.Pool); err != nil {
		return nil, fmt.Errorf("register user routes: %w", err)
	}
	protected.Mount("/users", userRouter)
	
	v1.Mount("/", protected)
	r.Mount("/v1", v1)
	api := chi.NewRouter()
	api.Mount("/api", r)

	httpServer := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           api,
		ReadHeaderTimeout: 5 * time.Second,
	}

	return &App{httpServer: httpServer, db: db}, nil
}

func (a *App) Start() error {
	return a.httpServer.ListenAndServe()
}

func (a *App) Shutdown(ctx context.Context) error {
	if err := a.httpServer.Shutdown(ctx); err != nil {
		return err
	}
	return a.db.Close()
}
