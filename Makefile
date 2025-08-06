# Makefile

.PHONY: help build up down restart logs clean dev prod

# Default target
help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build all Docker images
	@echo "Building Docker images..."
	docker-compose build

up: ## Start all services
	@echo "Starting all services..."
	docker-compose up -d

down: ## Stop all services
	@echo "Stopping all services..."
	docker-compose down

restart: ## Restart all services
	@echo "Restarting all services..."
	docker-compose restart

logs: ## Show logs from all services
	docker-compose logs -f

logs-backend: ## Show logs from backend service
	docker-compose logs -f backend

logs-frontend: ## Show logs from frontend service
	docker-compose logs -f frontend

logs-postgres: ## Show logs from postgres service
	docker-compose logs -f postgres

clean: ## Stop services and remove volumes
	@echo "Cleaning up..."
	docker-compose down -v
	docker system prune -f

dev: ## Start development environment
	@echo "Starting development environment..."
	docker-compose up --build

prod: ## Start production environment
	@echo "Starting production environment..."
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

shell-backend: ## Open shell in backend container
	docker-compose exec backend /bin/bash

shell-frontend: ## Open shell in frontend container
	docker-compose exec frontend /bin/sh

shell-postgres: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U postgres -d quicket

reset-db: ## Reset database (WARNING: This will delete all data)
	@echo "Resetting database..."
	docker-compose down
	docker volume rm quicket_postgres_data || true
	docker-compose up -d postgres
	@echo "Waiting for PostgreSQL to be ready..."
	sleep 10
	docker-compose up -d backend

status: ## Show status of all services
	docker-compose ps