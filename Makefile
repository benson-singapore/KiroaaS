.PHONY: help install dev dev-frontend dev-backend build clean docker-up docker-stop docker-logs

help:
	@echo "KiroaaS - 启动命令"
	@echo ""
	@echo "安装依赖:"
	@echo "  make install          安装前后端依赖"
	@echo ""
	@echo "开发模式:"
	@echo "  make dev              同时启动前后端"
	@echo "  make dev-frontend     仅启动前端 (Tauri)"
	@echo "  make dev-backend      仅启动后端 (FastAPI)"
	@echo ""
	@echo "生产构建:"
	@echo "  make build            构建前后端"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-up        启动 Docker 后端"
	@echo "  make docker-stop      停止 Docker 后端"
	@echo "  make docker-logs      查看 Docker 日志"
	@echo ""
	@echo "清理:"
	@echo "  make clean            清理构建文件"

install:
	@echo "Installing dependencies..."
	npm install
	cd python-backend && \
	  if [ ! -d venv ]; then python3 -m venv venv; fi && \
	  . venv/bin/activate && \
	  pip install -r requirements.txt

dev: dev-backend dev-frontend

dev-frontend:
	@echo "Starting frontend (Tauri dev)..."
	npm run tauri:dev

dev-backend:
	@echo "Starting backend (FastAPI)..."
	cd python-backend && \
	  . venv/bin/activate && \
	  python3 main.py

build:
	@echo "Building frontend..."
	npm run build
	@echo "Building Tauri app..."
	npm run tauri:build

clean:
	@echo "Cleaning up..."
	rm -rf dist/ build/
	cd python-backend && find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	npm run clean 2>/dev/null || true

docker-up:
	@echo "Starting Docker backend..."
	cd python-backend && docker-compose up -d

docker-stop:
	@echo "Stopping Docker backend..."
	cd python-backend && docker-compose down

docker-logs:
	@echo "Showing Docker logs..."
	cd python-backend && docker-compose logs -f

.DEFAULT_GOAL := help
