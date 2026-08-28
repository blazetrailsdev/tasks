---
title: "param-names.ts and arity.ts each declare their own TRAILING_CALLBACK_NAMES"
status: draft
updated: 2026-08-28
rfc: "0127-fidelity-tooling-signals-and-hygiene"
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

`TRAILING_CALLBACK_NAMES` — the trailing-parameter names that denote a ported
Ruby `&block`, so the strip that absorbs the convention can fire — is declared
TWICE with identical contents:

- `scripts/api-compare/arity.ts:135`, used by `stripTrailingCallback` at :175;
- `scripts/api-compare/param-names.ts:23`, used by `tsForms` at :114
  (added by PR #7162, RFC 0126).

Both checks run over the SAME matched pairs and both use the set to decide
whether a TS signature's last parameter is a ported block. `param-names.ts`
already imports `stripThis` and `isReceiverParam` from `arity.ts`, so the
receiver half of the convention IS shared and only this half is copied — the
comment at `param-names.ts:22` says "kept in step with it", which is a promise
no mechanism keeps.

The failure mode is silent and one-sided: adding a spelling (a port that names
its block `yielder`) to arity's copy alone leaves the parameter-name check
aligning against the un-stripped form, which reports a rename at every position
after it. That is the cascade shape RFC 0000's
`param-drift-positional-misalignment-is-a-dropped-parameter` exists to
disentangle, manufactured by the tooling instead of the port.

## Acceptance criteria

- One declaration. `TRAILING_CALLBACK_NAMES` is exported from `arity.ts`
  (where the strip it serves already lives) and imported by `param-names.ts`,
  alongside the `stripThis` / `isReceiverParam` imports already there.
- The `param-names.ts:22` comment promising the two stay in step goes with the
  duplicate — the import is the mechanism, so the comment stops being needed.
- No verdict changes: `pnpm parity:api` params and arity figures unmoved
  (arel 560/560 and 709/709), `pnpm parity:api:params` OK, and
  `pnpm vitest run scripts/api-compare/` green.
