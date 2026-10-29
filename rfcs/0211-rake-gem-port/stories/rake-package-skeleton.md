---
title: "@blazetrails/rake package skeleton"
status: ready
updated: 2026-10-29
rfc: "0211-rake-gem-port"
cluster: port
packages: [rake]
deps: [vendor-rake-13-2-1]
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

A new `packages/rake` mirroring `vendor/rake/v13.2.1/lib/rake/`, depending on `@blazetrails/ruby-compat` only. Registration follows `packages/thor` (CI lanes, guard fixtures, `parity:api` / `parity:test` enrolment, the path tables in `scripts/parity/conventions.ts`).

## Acceptance criteria

- [ ] `packages/rake` builds and is wired into CI the way `packages/thor` is.
- [ ] `parity:api` and `parity:test` see rake and report its files as unported.
- [ ] `version.ts` ports `rake/version.rb` (the one real file this story lands).
- [ ] `SCOPED_SKIP_GROUPS` records `thread_pool.rb`, `promise.rb`, `cpu_counter.rb` and `thread_history_display.rb` as not ported, citing the rake RFC § "`multitask` without a thread pool", and `parity:api` stays green with those four files skipped.
