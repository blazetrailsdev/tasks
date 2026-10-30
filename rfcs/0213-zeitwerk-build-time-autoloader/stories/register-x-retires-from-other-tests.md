---
title: "Other packages' tests drop registerX, and the definitions go"
status: draft
updated: 2026-10-30
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: zw-lookup
packages: ["actionpack", "activejob", "actioncable", "trailties"]
deps: ["register-x-retires-from-source"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0213 § "`registerX` retires". About 150 sites outside activerecord.

## Acceptance criteria

- All remaining test calls are converted.
- `registerController`, `registerJob`, `registerChannel`, `registerConnection` are deleted; `registerModel` is deleted once `register-x-retires-from-activerecord-tests` lands.
