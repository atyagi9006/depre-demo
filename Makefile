.PHONY: build run clean help

# Docker image configuration
IMAGE_NAME := depre-demo
TAG := latest
DOCKERFILE := Dockerfile.forever

# Default target
help:
	@echo "Available targets:"
	@echo "  build   - Build Docker image"
	@echo "  run     - Run Docker container"
	@echo "  clean   - Remove Docker image"
	@echo "  help    - Show this help message"

# Build Docker image
build:
	docker build -f $(DOCKERFILE) -t $(IMAGE_NAME):$(TAG) .

# Run Docker container
run:
	docker run -p 8080:8080 --rm $(IMAGE_NAME):$(TAG)

# Clean up Docker image
clean:
	docker rmi $(IMAGE_NAME):$(TAG)