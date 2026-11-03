---
title: "Other packages' tests drop registerX, and the definitions go"
status: in-progress
updated: 2026-11-03
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: zw-lookup
packages: ["actionpack", "activejob", "actioncable", "trailties"]
deps:
  - register-x-retires-from-source
  - manifest-and-rails-namespace-seats
deps-rfc: []
est-loc: 300
priority: null
pr: trails#9648
claim: "2026-11-03T01:36:39Z"
assignee: "register-x-retires-from-other-tests"
blocked-by: null
closed-reason: null
---

## Context

RFC 0213 § "`registerX` retires". About 150 sites outside activerecord.

## Acceptance criteria

- All remaining test calls are converted.
- `registerController`, `registerJob`, `registerChannel`, `registerConnection` are deleted; `registerModel` is kept: once `register-x-retires-from-activerecord-tests` lands its only caller is the generated model manifest (owner ruling, trails#9644; `generated-model-manifest-is-a-build-artifact`).
