---
title: "Exclude frozen docs/activerecord from vendor:recite"
status: draft
updated: 2026-09-26
rfc: "0159-versioned-vendor-layout"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm vendor:recite --check` (`scripts/vendor-recite.ts`) still reports
`docs/activerecord/rfc-0027-join-dependency-audit.md:52`
(`vendor/rails/activerecord/lib/active_record/associations/join_dependency.rb`)
after trails#8146, because `docs/activerecord/` is frozen (RFC 0011 Phase 4;
CI's `Docs ActiveRecord Freeze` job fails any PR that modifies a file there
other than `parity-verification.md`). The citation can never be recited, so
`gate-unversioned-and-stale-vendor-citations` would red on it permanently.

## Acceptance criteria

- `EXCLUDED` in `scripts/vendor-recite.ts` gains a `"docs/activerecord/"`
  entry whose reason names the freeze, and `scripts/vendor-recite.test.ts`
  covers it.
- Outside `packages/ruby-compat/` (handled by its own recite stories),
  `pnpm vendor:recite --check` reports no `docs/activerecord/` file.
