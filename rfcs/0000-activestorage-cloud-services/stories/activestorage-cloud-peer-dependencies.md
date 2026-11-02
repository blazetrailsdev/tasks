---
title: "Declare the AWS and GCS SDKs as optional peers and keep them out of eager imports"
status: draft
updated: 2026-11-02
rfc: "0000-activestorage-cloud-services"
cluster: as-cloud-infra
packages: [activestorage]
deps: [activestorage-configurator-loads-services]
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Decision 2. `packages/activestorage/package.json` follows the `pg` / `mysql2`
optional-peer precedent in `packages/activerecord/package.json`. The class-path
generator (`scripts/api-compare/class-paths.ts`) writes
`class-paths.generated.ts`, which imports each named module eagerly. Rails
equivalent: `gem "aws-sdk-s3", "~> 1.48"` (`vendor/rails/v8.0.2/activestorage/lib/active_storage/service/s3_service.rb:3`) and
`gem "google-cloud-storage", "~> 1.11"` (`vendor/rails/v8.0.2/activestorage/lib/active_storage/service/gcs_service.rb:3`).

## Acceptance criteria

- [ ] `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `@aws-sdk/lib-storage`
      and `@google-cloud/storage` are optional peers and devDependencies
- [ ] `s3-service.ts` and `gcs-service.ts` are absent from `index.ts` and
      `class-paths.generated.ts`, and their class paths register from the module itself
- [ ] A plain-node import of the built `dist/index.js`, with the four packages
      unresolvable, succeeds; verified, since a vitest run masks it
- [ ] `Service#serviceName`'s `rbModName` answers `S3` and `GCS`
      (`vendor/rails/v8.0.2/activestorage/lib/active_storage/service.rb`, `service_name`)
