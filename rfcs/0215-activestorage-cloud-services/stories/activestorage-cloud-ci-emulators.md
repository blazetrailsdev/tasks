---
title: "Run SeaweedFS and fake-gcs-server in a CI lane"
status: draft
updated: 2026-11-02
rfc: "0215-activestorage-cloud-services"
cluster: as-cloud-infra
packages: [activestorage]
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Decision 3 and the RFC's § "Emulators" table. The actioncable job in
`.github/workflows/ci.yml` (redis, line ~1643) is the service-container
precedent, but `ci.yml`'s own comment records that a service container takes no
arguments, and both emulators need them, so this uses `docker run` steps.
The `changes` job's run script is near the Actions size limit, so reuse an
existing output rather than adding to it.

## Acceptance criteria

- [ ] One SQLite-backed lane starts both emulators pinned by digest, waits for
      health, and creates the buckets with the SDKs
- [ ] No secret is in scope for the job
- [ ] A `docker compose` file runs the same pair locally
- [ ] SeaweedFS's KMS config is tried for SSE `AES256`; else the fallback from the
      RFC is taken and recorded
- [ ] The lane is required only where `activestorage` is affected
