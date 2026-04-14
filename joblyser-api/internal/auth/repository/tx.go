package auth_repository

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
)

type txBeginner interface {
	Begin(context.Context) (pgx.Tx, error)
}

func (q *Queries) ExecTx(ctx context.Context, fn func(*Queries) error) error {
	beginner, ok := q.db.(txBeginner)
	if !ok {
		return fmt.Errorf("database backend does not support transactions")
	}

	tx, err := beginner.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if err := fn(q.WithTx(tx)); err != nil {
		return err
	}

	if err := tx.Commit(ctx); err != nil {
		return err
	}

	return nil
}
