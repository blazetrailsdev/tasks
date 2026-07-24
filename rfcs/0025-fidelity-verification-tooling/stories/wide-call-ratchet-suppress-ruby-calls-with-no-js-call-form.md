---
title: "Wide call ratchet: suppress Ruby calls whose faithful JS port emits no call (to_s, each, empty?, first, size)"
status: ready
updated: 2026-07-24
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5182 taught the wide call ratchet that some Ruby calls port to a
differently-NAMED JS call (`any?` → `some`), dropping 278 baseline
entries. A larger residual cluster is the opposite case: Ruby calls
whose faithful JS port emits **no call at all**, so no alias can ever
match and the entry must be baselined forever.

Current counts in `scripts/api-compare/call-mismatches-wide-exclude/`
(6317 entries total) for calls in this shape:

- `to_s` 375 — template literal / implicit coercion
- `each` 338 — `for...of`
- `empty?` 169 — `.length === 0` / `.size === 0`
- `first` 121 / `last` 54 — `xs[0]` / `xs.at(-1)`
- `present?` 65 / `blank?` 46 — truthiness
- `size` 50 — `.length` property access

That is ~1200 of 6317 entries (~19%) that are structurally unresolvable
rather than pending convergence — they dilute the ratchet's signal the
same way `super` did before it was excluded from
`WIDE_SIGNIFICANT_CALLS`.

## Acceptance criteria

- The wide gate suppresses Ruby calls whose faithful JS port is a
  non-call construct, via an explicit, commented list next to
  `WIDE_SIGNIFICANT_CALLS` / `JS_ENUMERABLE_ALIASES` in `compare.ts`
  (mirroring the documented `super` precedent).
- Each suppressed name is justified in a comment with the JS construct
  it becomes; names that could hide a real omission (e.g. `delete`,
  `merge`, `fetch` — all of which DO have JS call forms) are NOT
  suppressed.
- Wide baseline reseeded; the removal set is verified to contain only
  entries whose `call` is on the new list (key-set diff, 0 added).
- Narrow ratchet (`pnpm api:calls`) unchanged.
