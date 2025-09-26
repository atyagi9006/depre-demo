#!/bin/bash

# Script to publish Docker images to GitHub Container Registry (GHCR)
# Usage: ./publish-to-ghcr.sh

set -e

# Configuration
GITHUB_USERNAME="atyagi9006"
REGISTRY="ghcr.io"
IMAGE_NAME="${REGISTRY}/${GITHUB_USERNAME}/depre-demo"

echo "==================================================="
echo "Docker Image Publishing to GitHub Container Registry"
echo "==================================================="
echo ""

# Check if images are built
echo "Checking for built images..."
if ! docker images | grep -q "${IMAGE_NAME}"; then
    echo "❌ No images found. Building images first..."
    docker build -t ${IMAGE_NAME}:latest -t ${IMAGE_NAME}:1.0.0 .
else
    echo "✅ Images found:"
    docker images | grep "${IMAGE_NAME}"
fi

echo ""
echo "==================================================="
echo "AUTHENTICATION REQUIRED"
echo "==================================================="
echo ""
echo "To publish to GHCR, you need to authenticate first:"
echo ""
echo "1. Create a GitHub Personal Access Token (PAT):"
echo "   - Go to: https://github.com/settings/tokens/new"
echo "   - Select scopes: write:packages, read:packages, delete:packages (optional)"
echo "   - Copy the generated token"
echo ""
echo "2. Set the token as an environment variable:"
echo "   export GITHUB_TOKEN=your_token_here"
echo ""
echo "3. Login to GHCR:"
echo "   echo \$GITHUB_TOKEN | docker login ${REGISTRY} -u ${GITHUB_USERNAME} --password-stdin"
echo ""
echo "==================================================="

# Check if GITHUB_TOKEN is set
if [ -z "$GITHUB_TOKEN" ]; then
    echo ""
    echo "❌ GITHUB_TOKEN environment variable is not set."
    echo "Please follow the authentication steps above."
    exit 1
fi

# Login to GHCR
echo ""
echo "Logging in to GitHub Container Registry..."
echo $GITHUB_TOKEN | docker login ${REGISTRY} -u ${GITHUB_USERNAME} --password-stdin

if [ $? -ne 0 ]; then
    echo "❌ Failed to login to GHCR. Please check your token and try again."
    exit 1
fi

echo "✅ Successfully logged in to GHCR"

# Push images
echo ""
echo "Pushing images to GHCR..."
echo "==================================================="

# Push all tags
for tag in latest 1.0.0; do
    echo ""
    echo "Pushing ${IMAGE_NAME}:${tag}..."
    docker push ${IMAGE_NAME}:${tag}
    if [ $? -eq 0 ]; then
        echo "✅ Successfully pushed ${IMAGE_NAME}:${tag}"
    else
        echo "❌ Failed to push ${IMAGE_NAME}:${tag}"
    fi
done

echo ""
echo "==================================================="
echo "PUBLISHING COMPLETE!"
echo "==================================================="
echo ""
echo "Your images are now available at:"
echo "  - ${IMAGE_NAME}:latest"
echo "  - ${IMAGE_NAME}:1.0.0"
echo ""
echo "View your package at:"
echo "  https://github.com/${GITHUB_USERNAME}/depre-demo/pkgs/container/depre-demo"
echo ""
echo "To pull the images:"
echo "  docker pull ${IMAGE_NAME}:latest"
echo "  docker pull ${IMAGE_NAME}:1.0.0"
echo ""
echo "Note: By default, packages are private. To make them public:"
echo "  1. Go to the package page (link above)"
echo "  2. Click on 'Package settings'"
echo "  3. Change visibility to 'Public'"
echo "  4. Link the package to your repository"
echo ""