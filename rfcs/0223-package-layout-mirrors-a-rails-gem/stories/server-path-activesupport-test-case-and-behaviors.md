---
title: "server-path-activesupport-test-case-and-behaviors"
status: draft
updated: 2026-11-06
rfc: "0223-package-layout-mirrors-a-rails-gem"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/layout/server-path-closure.ts` (RFC 0223) finds these testing modules reachable from a non-testing export of the built tree, each a row of `scripts/layout/server-path-closure-exclude.json` naming this story:

- `packages/activesupport/dist/{test-case,executor/test-helper,testing/file-fixtures}.js` and the eight `cache/behaviors/*-behavior.js` (exported through `./*`).

Rails' `active_support.rb` loads none of these; the cache behaviors are test-suite files (`vendor/rails/v8.0.2/activesupport/test/cache/behaviors/`).

## Acceptance criteria

- [ ] No non-testing export (including each `./*` wildcard expansion) of the built tree reaches these modules; they are reached only through testing subpath exports, or moved to `test/` when test-suite-private.
- [ ] Their rows are deleted from `server-path-closure-exclude.json`.
