---
title: "Burn down the 130 ambiguous Rails citations the cite ratchet is seeded at"
status: draft
updated: 2026-08-28
rfc: "0121-internal-tag-accounting"
cluster: null
packages: []
deps: []
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

#7165 landed the citation checker (`scripts/api-compare/cites.ts`,
`pnpm parity:api:cites`, RFC 0121) and seeded
`scripts/api-compare/cite-mark.json` at **130** unverifiable citations. Every
one of the 130 is the same `ambiguous` problem: the receipt cites a bare
basename that resolves to more than one `.rb` under `vendor/`, so the checker
cannot tell which file the line number belongs to and the IN-RANGE and
METHOD-MEMBERSHIP properties are never actually applied to it.

The other three problems are at zero — #7165 converged all ten non-ambiguous
findings rather than baselining them.

The population, by cited basename (`pnpm parity:api:cites` prints each one with
its candidate list):

- `base.rb` — 15 candidates, cited from `packages/i18n/src/backend/base.ts`
- `railtie.rb` — 11, from `packages/trailties/src/trailtie{,/per-class-state}.ts`
- `callbacks.rb` — 11, from `packages/activesupport/src/callbacks.ts`
- `conversions.rb` — 10, from `activesupport/src/{core-ext/hash,range-ext}.ts`
- `log_subscriber.rb`, `gem_version.rb`, `engine.rb`, `cache.rb`, `json.rb`,
  `blank.rb`, `assertions.rb`, `minitest.rb`, `simple.rb`, `quoting.rb`,
  `configurable.rb`, `subscriber.rb`, `length.rb` — the rest

## Converged shape

Qualify each citation with enough of its directory to resolve to exactly one
vendored file, which is the fix #7115 applied by hand and the one the checker's
`ambiguous` detail line already prints (`resolveCite` matches on a trailing
path suffix, so `backend/base.rb` or `abstract/schema_statements.rb` is
usually enough — a full `vendor/rails/...` path always is).

This is mechanical per citation but needs a human read per receipt: the whole
point is that the basename alone does not say which file was meant, so each one
has to be resolved against what the surrounding reason claims. Do NOT resolve
by picking the same-package candidate automatically — a receipt in
`activesupport/src/callbacks.ts` citing `callbacks.rb:262-263` most likely means
`vendor/rails/activesupport/lib/active_support/callbacks.rb`, but that is a
hypothesis to check against the cited line, not a rule.

Expect the qualification pass to surface real IN-RANGE and METHOD-MEMBERSHIP
failures underneath, since those two properties have never run on any of these
130 — converge those as citations too, never by baselining.

## Acceptance criteria

- `scripts/api-compare/cite-mark.json` is narrowed with
  `pnpm parity:api:cites:tighten` (which only writes DOWN — there is no reseed).
- Every citation converged in the pass resolves to exactly one vendored `.rb`,
  is in range, and is inside the method its reason names — or carries
  `use-site:` because it cites a use site.
- Splitting the burndown across several PRs is fine; each lowers the mark.
