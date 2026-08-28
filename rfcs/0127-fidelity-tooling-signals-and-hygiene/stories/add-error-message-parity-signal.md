---
title: "Add a raise-message parity signal to parity:api"
status: ready
updated: 2026-08-28
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 7
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

CLAUDE.md's fidelity contract requires "same error class, same message string,
same raise site", but the 2026-08-03 api-signals audit found zero tooling for
message strings: `scripts/api-compare/literals.ts` compares only
default/constant values (587 compared, 1 differing), and error CLASS names
surface only as declarations via `parity:api`. Raise-site message strings are
unmeasured.

Proposed shape: extract `raise Klass, "literal"` sites in
`scripts/api-compare/extract-ruby-api.rb` alongside the existing call-walk
(`walk_for_calls`), match against `throw new Klass("literal")` in
`scripts/api-compare/extract-ts-api.ts`, per matched method pair; ratchet with
the shared baseline machinery from `lint-call-mismatches.ts`
(`diffAgainstBaseline` / `reseed` / `missingScope`). Interpolated messages
(`#{...}` / template literals) need a normalization story — comparing the
literal fragments around the interpolation is likely sufficient for a first
cut.

## Acceptance criteria

- A new advisory dimension in `parity:api` output lists matched pairs whose
  Ruby body raises with a message literal the TS body does not throw
  (class mismatch or message-fragment mismatch).
- A seeded only-shrink baseline plus lint gates new mismatches in CI, same
  contract as the call ratchets (NEW fails, STALE fails, partial-scope guard).
- `weakCalls`-style noise control: raises whose class resolution is ambiguous
  are excluded from the population, not baselined.

## Re-verified 2026-08-17 (draft sweep)

Still valid. `ls scripts/api-compare/` shows no error/message/raise extractor — the
dimension remains unbuilt. `literals.ts` still compares only default/constant
values (698 compared, 1 differing on the 2026-08-17 run, up from 587).
Title was a slug placeholder; set to a real title.
