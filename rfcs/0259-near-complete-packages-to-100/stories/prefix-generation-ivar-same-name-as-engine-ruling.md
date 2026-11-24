---
title: "prefix-generation-ivar-same-name-as-engine-ruling"
status: draft
updated: 2026-11-24
rfc: "0259-near-complete-packages-to-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/actionpack/test/action-dispatch/dispatch/prefix-generation.test.ts:353`
skips "[APP] instance variable with same name as engine"
(`vendor/rails/v8.0.5.2/actionpack/test/dispatch/prefix_generation_test.rb`).
In Ruby the controller's `@blog_engine` ivar and its `blog_engine` mounted
helper are separate names. A JS object has one namespace for fields and
methods, so a `blogEngine` field is the mounted helper, and assigning to it
raises `TypeError`. The skip carries `PERMANENT-SKIP:` prose inside the body,
but no CLAUDE.md section or dated operator ruling backs it, so it does not
count as permanent (RFC 0259 triage rule).

## Acceptance criteria

- [ ] Port the test with a faithful ivar spelling that does not collide with the mounted helper, OR get an operator ruling and receipt the skip under a `PERMANENT-SKIP:` line citing it.
- [ ] `pnpm parity:test -- --package actiondispatch` no longer counts it as a plain skip.
