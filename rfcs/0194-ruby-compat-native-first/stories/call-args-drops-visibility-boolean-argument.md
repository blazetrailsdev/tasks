---
title: "call-args: respond_to?(name, true) / methods(true) against a one-argument port is not a shape row"
status: draft
updated: 2026-10-16
rfc: "0194-ruby-compat-native-first"
cluster: gate
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Once `rbObjRespondTo` / `basicObjRespondTo` lose their visibility flag, a
Rails `respond_to?(name, true)`, `respond_to_missing?(name, include_private)`
forward, or `instance_methods(false)`-style visibility boolean has one more
argument than its port. `parity:api:calls:args` (`scripts/api-compare/call-args.ts`)
would report a `shape` row for each.

## Acceptance criteria

- [ ] `call-args.ts` drops a trailing visibility-boolean argument for `respond_to?`, `respond_to_missing?`, `methods`, `public_methods` and `method_defined?` before comparing. The quantity rule cites the CLAUDE.md section.
- [ ] Rows made stale are deleted by hand and `parity:api:calls:tighten` is run, with no reseed.
- [ ] Tests: `respond_to?(name, true)` against `rbObjRespondTo(obj, name)` produces no row, and `respond_to?(name, other)` with a non-boolean still compares.
