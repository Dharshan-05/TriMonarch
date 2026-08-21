# TriMonarch ERP — Documentation Guide

## Documentation Structure

```
docs/
├── architecture/               # Backend architecture reference (Phase 078)
│   ├── README.md
│   ├── overview.md
│   ├── project-structure.md
│   ├── request-lifecycle.md
│   ├── layered-architecture.md
│   ├── dependency-rules.md
│   ├── authentication.md
│   ├── authorization.md
│   ├── multi-tenancy.md
│   ├── domains.md
│   ├── state-machines.md
│   ├── transactions.md
│   ├── error-handling.md
│   ├── validation.md
│   ├── security.md
│   ├── observability.md
│   ├── deployment.md
│   └── documentation-guide.md  ← This file
│
├── database/                   # Database documentation (Phase 077)
│   ├── architecture.md
│   ├── schema.md
│   ├── erd.md
│   ├── relationships.md
│   ├── tenant-isolation.md
│   ├── constraints.md
│   ├── indexes.md
│   ├── migrations.md
│   ├── transactions.md
│   ├── audit-events.md
│   ├── security.md
│   ├── development-database.md
│   └── testing-database.md
│
└── api/                        # API documentation (Phase 076, OpenAPI)
    └── (served at /openapi.json and /api-docs)
```

---

## Adding New Documentation

### Adding a New Architecture Section

1. Create a new `.md` file in `docs/architecture/`
2. Add it to `docs/architecture/README.md` table of contents
3. Add it to `REQUIRED_ARCH_FILES` in `tests/docs/architecture/architectureDocumentationScanner.ts`
4. Run `npm run test:docs:architecture` to verify

### Adding New Database Documentation

1. Create a new `.md` file in `docs/database/`
2. Add it to `REQUIRED_DOC_FILES` in `tests/docs/database/databaseDocumentationScanner.ts`
3. Run `npm run test:docs:database` to verify

### Adding New API Routes

1. Add paths to `src/docs/openapiRoutes.ts`
2. Add schemas to `src/docs/openapiSchemas.ts`
3. Run `npm run test:docs` to verify

---

## Documentation Standards

### Security Rules

Never include in any documentation:
- Real passwords or password hashes
- JWT secrets or signing keys
- Database connection strings with credentials
- Production IP addresses or hostnames
- Private keys or certificates

### Format Rules

- Use GitHub Flavored Markdown
- Use Mermaid diagrams for architecture flows
- Use tables for structured comparisons
- Use code blocks with language identifiers

### Accuracy Rules

- Documentation must reflect the actual implementation, not aspirational design
- File paths must be verified against the actual project structure
- Table names must match migration files
- Error codes must match `src/errors/errorCodes.ts`

---

## Automated Documentation Validation

Documentation is validated automatically by the test suite:

```bash
npm run test:docs:database      # Validates docs/database/
npm run test:docs:architecture  # Validates docs/architecture/
npm run test:docs               # Validates all documentation tests
```

All validations check:
- Required files exist
- Required keywords/sections are present
- No credentials or secrets appear in documentation
- Domain coverage is complete

---

## Documentation Phases

| Phase | Documentation |
|-------|--------------|
| Phase 076 | API Documentation (OpenAPI 3.1) |
| Phase 077 | Database Documentation |
| Phase 078 | Backend Architecture Documentation |
