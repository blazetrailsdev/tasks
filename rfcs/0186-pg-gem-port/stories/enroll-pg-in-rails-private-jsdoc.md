---
title: "Enroll packages/pg/lib in rails-private-jsdoc"
status: draft
updated: 2026-11-21
rfc: "0186-pg-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/pg/lib` and `packages/mysql2/lib` were created by trails#10317 and trails#10477. trails#10477 enrolled `packages/mysql2/lib/**/*.ts` in the `rails-private-jsdoc` block of both `eslint.config.mjs` and `eslint/rails-private-jsdoc.config.mjs`, because without enrollment the scoped `rails-private` gate (`scripts/ci/scoped-comparison.sh:64`) errors: "all of the files matching the glob pattern ... are ignored". `packages/pg/lib` is still not enrolled, so the gate errors for pg in the same way.

## Acceptance criteria

- [ ] `packages/pg/lib/**/*.ts` is in the `rails-private-jsdoc` `files` list of both configs, kept in sync.
- [ ] `pnpm exec eslint --no-inline-config --config eslint/rails-private-jsdoc.config.mjs packages/pg/lib` is clean: Rails-private pg methods carry `@internal`.
