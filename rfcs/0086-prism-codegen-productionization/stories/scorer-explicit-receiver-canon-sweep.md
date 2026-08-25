---
title: "Canonicalize the remaining explicit-receiver spellings in the scorer's TOKEN_CANON"
status: done
updated: 2026-08-01
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5825
claim: "2026-08-01T19:45:02Z"
assignee: "scorer-explicit-receiver-canon-sweep"
blocked-by: null
closed-reason: null
---

## Context

PR #5818 added `modelClass: "model"` to `TOKEN_CANON` in
`scripts/prism-codegen/score.ts`, canonicalizing the port's private
`_modelClass` backing field against Rails' `model` receiver
(`relation.ts:6237-6246` mirrors `relation.rb`'s `attr_reader :model` /
`alias :klass :model`).

`modelClass` is not the only such spelling. `scripts/api-compare/arity.ts:95-115`
registers a whole list of deliberate explicit-receiver spellings observed across
the port — `recordClass`, `recordOrClass`, `host`, `target`, `adapter`, `node`,
`association`, `connections`, `targets` and others — each backed by at least one
real mismatch. Any of those that stand in for a differently-spelled Rails
receiver produce the same pure-naming noise in the scorer's divergent skeletons
that `modelClass` did: the skeleton diff shows a `ref:` mismatch that is not a
real divergence, which a reviewer has to re-triage on every convergence pass.

Note the measured lesson from #5818: adding the `modelClass` entry did NOT move
the matched count (33 before, 33 after), because all 13 defs it touched also
diverge structurally. Expect the same here — the value is denoising the
convergence-guard review queue, not the score. Measure before claiming
otherwise.

## Acceptance criteria

- For each explicit-receiver spelling in `arity.ts`'s list, determine whether it
  stands in for a differently-spelled Rails receiver (check the port symbol and
  its Rails twin) or is already spelled the same on both sides.
- Add `TOKEN_CANON` entries only for the ones that genuinely differ; do not add
  an entry that would collapse two distinct receivers.
- Report the measured `pnpm codegen:score` matched count before and after; a
  flat count is an acceptable outcome if the denoising is real (state which
  defs' skeletons it cleans).
- `pnpm codegen:score --guard` stays green.
- Each added entry gets a scorer unit test that fails without it.
