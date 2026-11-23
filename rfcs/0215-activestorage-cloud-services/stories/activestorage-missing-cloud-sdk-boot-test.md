---
title: "Test that a missing cloud SDK fails boot with Missing service adapter"
status: in-progress
updated: 2026-11-23
rfc: "0215-activestorage-cloud-services"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#10633
claim: "2026-11-23T09:42:28Z"
assignee: "activestorage-engine-service-load-reads-lazy-configs"
blocked-by: null
closed-reason: null
---

## Context

`Configurator.load` (`packages/activestorage/lib/service/configurator.ts`) records
`ERR_MODULE_NOT_FOUND` from `import("./s3-service.js")` when `@aws-sdk/client-s3`
is absent, so `resolve` raises `Missing service adapter for "S3"`, mirroring
`configurator.rb:30-35`'s `rescue LoadError` (the gem line at `s3_service.rb:3`).
No test covers the missing-SDK case: `vi.doMock` wraps a factory's error and
drops its `code`, so it cannot be faked in-process (trails#10614 review, finding 7).

## Acceptance criteria

- [ ] A CI step, or a subprocess test, runs with the optional cloud peers
      uninstalled and asserts that boot with `service: S3` / `GCS` raises Rails' message
