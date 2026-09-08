---
title: "extra-surface-does-not-apply-token-renames-to-class-names"
status: draft
updated: 2026-09-08
rfc: "0127-fidelity-tooling-signals-and-hygiene"
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

`TOKEN_RENAMES` in `scripts/parity/conventions.ts:36-45` maps `ERB` → `TSE`,
and `applyTokenRenames` (`conventions.ts:104-106`) fires it on Ruby method
names and constant fragments that flow through `snakeToCamel`. It is never
applied to a Ruby CLASS name, so `parity:api:extra` does not admit the renamed
spelling of a class.

`extra-surface.ts:1611-1618` builds the allowed Ruby-constant candidates from
the class's short name plus `TS_CLASS_RENAMES[short]`. `ERBTracker`
(`vendor/rails/actionview/lib/action_view/dependency_tracker/erb_tracker.rb:5`)
is in neither set, so the faithful port `TSETracker`
(`packages/actionview/src/dependency-tracker/tse-tracker.ts`) scores as
`novel` extra surface even though `parity:api` matches
`dependency_tracker/erb_tracker.rb ↔ dependency-tracker/tse-tracker.ts` at
13/13 (100%). This is exactly the two-tools-disagree failure the
`TS_CLASS_RENAMES` branch there was added to fix, one rule over.

actionview is not in `GATED_PACKAGES`, so today this is a report-only
miscount; it becomes a false red the moment actionview is enrolled, and it
will recur for every ERB-named Rails class ported under the mandatory `tse`
spelling.

## Acceptance criteria

- [ ] `parity:api:extra` admits a token-renamed class spelling — `TSETracker`
      counts as the port of `ERBTracker` — by running the same
      `TOKEN_RENAMES` table over the Ruby class short name in
      `rubyConstantCandidates` / the allowed set at
      `extra-surface.ts:1611-1618`, rather than by a per-class
      `TS_CLASS_RENAMES` entry.
- [ ] `pnpm parity:api:extra --package actionview` reports 0 novel for
      `dependency-tracker/tse-tracker.ts`.
- [ ] A `scripts/api-compare/extra-surface.test.ts` case pins the rename.
- [ ] No gated package's `novel` or `total` mark rises.
