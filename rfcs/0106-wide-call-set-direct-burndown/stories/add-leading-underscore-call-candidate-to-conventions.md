---
title: "add-leading-underscore-call-candidate-to-conventions"
status: in-progress
updated: 2026-08-21
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6825
claim: "2026-08-21T14:50:39Z"
assignee: "add-leading-underscore-call-candidate-to-conventions"
blocked-by: null
closed-reason: null
---

# Offer a leading-underscore call candidate in `conventions.ts`

## Context

Surfaced by `audit-seeded-call-set-reasons-for-already-converged-rows` (RFC
0106, `## Seeded-reason audit (measured 2026-08-21)`), which found 18 of the 414
bulk-seeded `kind: "set"` baseline rows held open **not** by a body divergence
but by a naming-table gap — the same mechanism the review of PR #6728 found for
the `readonly_attribute?` rows.

trails prefixes a private helper with `_` to keep it off the public surface (the
convention `eslint/rails-private-methods.json` is generated from), so Rails'
`convert_value_to_parameters` legitimately ports as `_convertValueToParameters`.
`scripts/parity/conventions.ts` preserves a Ruby name's _own_ leading underscore
(`:83`) and special-cases an underscore-prefixed writer (`:1518-1524`), but
never offers `"_" + camel` as a candidate for a bare Ruby name — so the call-set
matcher scores the call as missing.

Measured distribution of the 18 rows:

| shard                                           | rows |
| ----------------------------------------------- | ---- |
| `actioncontroller/metal/strong-parameters.json` | 14   |
| `activemodel/model.json`                        | 1    |
| `activemodel/attribute-methods.json`            | 1    |
| `activerecord/type/type-map.json`               | 1    |
| `activerecord/type/serialized.json`             | 1    |

## Converged shape

Add `"_" + camel` as the **trailing** candidate for every Ruby name in the
candidate list `conventions.ts` produces — after the existing candidates, the
way the `Q` suffix is offered last for predicates — so no existing match is
displaced. Regenerate `docs/ruby-ts-conventions.md` from the source (never
hand-edit it) and update `conventions.test.ts`.

This re-matches every package's manifest, so it must land as its own PR with its
own `parity:api` delta rather than folded into a burndown wave.

## Acceptance criteria

- [ ] The rule lives in `scripts/parity/conventions.ts`; `docs/ruby-ts-conventions.md`
      is regenerated, not hand-edited.
- [ ] The 18 rows above are deleted from `call-mismatches-exclude/` by hand via
      `serializeBaseline`, and each affected shard mark tightened with
      `pnpm parity:api:calls:tighten <shard>`. No `--write`, no reseed.
- [ ] `pnpm parity:api` / `pnpm parity:test` deltas non-negative; report the
      method-match delta the new candidate produces.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
- [ ] Split across PRs if the retirements exceed the LOC ceiling; file the rest.
