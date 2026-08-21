# TriMonarch ERP — Production Deployment Procedure

## Complete Deployment Procedure

### 1. Pre-Deployment Quality Gates (CI/CD)

Before creating a deployment artifact, all strict quality gates must pass:

```bash
npm run typecheck
npm run build
npm run test
npm run lint
```

### 2. Artifact Creation & Container Publishing

```bash
docker build -t <REGISTRY_URL>/trimonarch-backend:<IMAGE_TAG> .
docker push <REGISTRY_URL>/trimonarch-backend:<IMAGE_TAG>
```

### 3. Database Migration Execution

Execute migrations prior to rolling out updated application code:

```bash
npm run db:migrate
```

### 4. Application Rollout & Verification

1. Deploy updated container image to target environment.
2. Verify liveness via `GET /health/live` (HTTP 200).
3. Verify database readiness via `GET /health/ready` (HTTP 200).
4. Run post-deployment smoke tests against operational API endpoints.
