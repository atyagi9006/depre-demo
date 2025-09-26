# Deprecated Hoek Demo

A demonstration project showcasing the deprecated Hoek v6.0.4 library with known security vulnerabilities. This project is for educational purposes to understand dependency deprecation and security issues.

## ⚠️ Security Warning

This project intentionally uses **Hoek v6.0.4**, which contains:
- **CVE: GHSA-c429-5p7v-vgjp** - High severity prototype pollution vulnerability
- Deprecated package warnings

**DO NOT USE IN PRODUCTION**

## Project Structure

- `index.js` - Demonstrates various Hoek utility functions
- `server.js` - HTTP server using Hoek for configuration management
- `vulnerability-demo.js` - Shows the prototype pollution vulnerability
- `Dockerfile` - Multi-stage Docker build configuration
- `.github/workflows/docker-publish.yml` - GitHub Actions workflow for GHCR publishing

## Local Development

### Prerequisites
- Node.js v18+
- Docker (optional)
- GitHub account (for GHCR publishing)

### Installation

```bash
# Clone the repository
git clone https://github.com/atyagi9006/depre-demo.git
cd depre-demo

# Install dependencies (will show deprecation warnings)
npm install
```

### Running the Application

```bash
# Run demo examples
npm run demo

# Start HTTP server
npm start

# Run vulnerability demonstration
npm run vulnerability
```

## Docker Usage

### Build Locally

```bash
# Build the Docker image
docker build -t depre-demo:local .

# Run the container
docker run -p 8080:8080 depre-demo:local
```

### Using Docker Compose

```bash
# Start the production service
docker-compose up app

# Start the development service with live reload
docker-compose up dev

# Build and start all services
docker-compose up --build
```

### Access the Application

- Production: http://localhost:8080
- Development: http://localhost:3000
- Health endpoint: http://localhost:8080/health
- Config endpoint: http://localhost:8080/config

## GitHub Container Registry (GHCR)

### Automatic Publishing

The GitHub Actions workflow automatically builds and publishes Docker images to GHCR when:
- Pushing to main/master branch
- Creating version tags (v*)
- Manual workflow dispatch

### Pull from GHCR

```bash
# Pull the latest image
docker pull ghcr.io/atyagi9006/depre-demo:latest

# Pull a specific version
docker pull ghcr.io/atyagi9006/depre-demo:v1.0.0

# Run the container
docker run -p 8080:8080 ghcr.io/atyagi9006/depre-demo:latest
```

### Manual Publishing to GHCR

1. Generate a GitHub Personal Access Token with `write:packages` scope
2. Login to GHCR:
```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

3. Build and tag the image:
```bash
docker build -t ghcr.io/atyagi9006/depre-demo:latest .
docker build -t ghcr.io/atyagi9006/depre-demo:v1.0.0 .
```

4. Push to GHCR:
```bash
docker push ghcr.io/atyagi9006/depre-demo:latest
docker push ghcr.io/atyagi9006/depre-demo:v1.0.0
```

## Image Tags

The workflow creates multiple tags:
- `latest` - Latest from main branch
- `main` or `master` - Branch-based tags
- `v1.0.0` - Semantic version tags
- `1.0`, `1` - Major/minor version tags
- `main-sha-abc123` - SHA-based tags for tracking

## Security Scanning

The workflow includes:
- Trivy vulnerability scanning
- Results uploaded to GitHub Security tab
- Multi-platform builds (amd64, arm64)

## Viewing Package in GitHub

Once published, the package will be visible at:
- https://github.com/atyagi9006/depre-demo/pkgs/container/depre-demo

## Package Visibility

By default, packages are private. To make public:
1. Go to package settings
2. Change visibility to public
3. Link to repository for better discoverability

## Recommendations

For production use:
1. Upgrade to `@hapi/hoek` (latest version)
2. Run `npm audit fix` to resolve vulnerabilities
3. Use security scanning in CI/CD pipelines
4. Regularly update dependencies

## License

ISC
