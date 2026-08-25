---
title: "scorer-model-vs-modelclass-token"
status: done
updated: 2026-08-01
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5818
claim: "2026-08-01T19:15:00Z"
assignee: "scorer-model-vs-modelclass-token"
blocked-by: null
closed-reason: null
---

## Context

`delegate-macro-receiver-resolution` (PR #5816) made the generator emit
`this.model.primaryKey` for Rails' `delegate :primary_key, to: :model`,
converging 29 call sites across the target files. None of them flipped a
scorer row, because the trails port spells Relation's `model` reach as
`modelClass`: the generated skeleton reads `ref:model ref:primaryKey` where
the port reads `ref:modelClass ref:primaryKey`, so those defs stay
`divergent` on a pure naming difference.

`TOKEN_CANON` in `scripts/prism-codegen/score.ts` already canonicalizes such
pairs (`collect`/`map`, `size`/`length`). Adding `modelClass: "model"` alone
was measured during #5816 and moved nothing — the affected defs also diverge
structurally — so this story is about finding whether the `model`/`modelClass`
divergence is worth canonicalizing in the scorer or converging in the port,
not about landing the one-line token entry blind.

Relevant: `scripts/prism-codegen/score.ts` (`TOKEN_CANON`, `normalizeName`),
`scripts/prism-codegen/delegation.ts`,
`vendor/rails/activerecord/lib/active_record/relation/delegation.rb:101-106`.

## Acceptance criteria

- Determine whether `modelClass` is the port's deliberate spelling of Rails'
  `model` (check `packages/activerecord/src/relation.ts` and the api-compare
  name mapping) — if it is a divergence, converge the port; if it is a
  deliberate rename, canonicalize it in the scorer.
- Whichever path: `pnpm codegen:score` matched count increases, or the story
  closes with a written finding that it cannot.
- Convergence guard stays green (`pnpm codegen:score --guard`).
