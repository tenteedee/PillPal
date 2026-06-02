SHELL := /bin/bash

MIGRATIONS_DIR := supabase/migrations

.PHONY: help migration-new migration-list migration-up swag

help:
	@echo "Targets:"
	@echo "  make migration-new name=<migration_name>"
	@echo "  make migration-list"
	@echo "  make migration-up"

migrate-new:
	@if [ -z "$(name)" ]; then \
		echo "Usage: make migration-new name=<migration_name>"; \
		exit 1; \
	fi
	@mkdir -p $(MIGRATIONS_DIR)
	@safe_name="$$(echo "$(name)" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/_/g; s/^_+|_+$$//g')"; \
	timestamp="$$(date +%Y%m%d%H%M%S)"; \
	file="$(MIGRATIONS_DIR)/$${timestamp}_$${safe_name}.sql"; \
	{ \
		echo "-- Migration: $${safe_name}"; \
		echo "-- Created at: $$(date -u +%Y-%m-%dT%H:%M:%SZ)"; \
		echo; \
		echo "-- Write your SQL below"; \
	} > "$$file"; \
	echo "Created migration: $$file"

migrate-list:
	@mkdir -p $(MIGRATIONS_DIR)
	@find $(MIGRATIONS_DIR) -maxdepth 1 -type f -name '*.sql' | sort

migrate-up:
	@if ! command -v supabase >/dev/null 2>&1 && ! command -v npx >/dev/null 2>&1; then \
		echo "Supabase CLI is required. Install it first: https://supabase.com/docs/guides/cli"; \
		exit 1; \
	fi
	@if [ -f .env ]; then \
		set -a; source .env; set +a; \
	fi; \
	if [ -z "$${SUPABASE_DB_URL}" ]; then \
		echo "Missing SUPABASE_DB_URL in backend/.env"; \
		echo "Example: SUPABASE_DB_URL=postgresql://postgres.<project-ref>:<password>@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres"; \
		exit 1; \
	fi; \
	echo "Applying migrations from $(MIGRATIONS_DIR) to remote database..."; \
	if command -v supabase >/dev/null 2>&1; then \
		supabase db push --db-url "$$SUPABASE_DB_URL"; \
	else \
		npx supabase db push --db-url "$$SUPABASE_DB_URL"; \
	fi

swag:
	@node --import tsx src/shared/docs/generate-openapi.ts
