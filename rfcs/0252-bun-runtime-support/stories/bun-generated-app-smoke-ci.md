---
title: "Non-blocking Bun CI job: generated-app smoke and the sqlite suite"
status: draft
updated: 2026-11-19
rfc: "0252-bun-runtime-support"
cluster: ci
packages: [trailties, activerecord]
deps: [zeitwerk-hooks-via-bun-plugin, bun-sqlite-driver]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The RFC's § CI and § Verification.

## Acceptance criteria

- [ ] The job installs Bun 1.3.x and runs `trails new`, `db:migrate`, `server` plus one request, and `test` under `bun`.
- [ ] It runs the activerecord sqlite suite on `bun-sqlite`.
- [ ] It is `continue-on-error`. Making it required is `bun-ci-required-check` (RFC Open question 1).
