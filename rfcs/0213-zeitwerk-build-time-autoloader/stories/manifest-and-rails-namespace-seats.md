---
title: "manifest-and-rails-namespace-seats"
status: in-progress
updated: 2026-11-03
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
packages: []
deps:
  - register-x-retires-from-source
deps-rfc: []
est-loc: null
priority: null
pr: trails#9644
claim: "2026-11-03T00:16:39Z"
assignee: "manifest-and-rails-namespace-seats"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord-cli/src/generate-manifest.ts:221-231` still emits `registerModel` into application barrels. Seating with `constSet` there was tried on trails#9625 and failed: a generated app does not depend on ruby-compat or activesupport, and `m.name` loses a namespaced name. The four `Rails::*Controller` files also still use `registerConstant`, because `Rails` has no namespace object (`packages/trailties/src/rails.ts:38` is `Trails`).

## Acceptance criteria

- activerecord exports a public seat the manifest can call, or the manifest retires.
- `Rails::*Controller` seats on a namespace object.
