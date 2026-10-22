---
title: "i18n: the 8 moved extra-surface names reach zero"
status: ready
updated: 2026-10-22
rfc: "0193-small-gem-ports-parity-100"
cluster: small-residuals
packages: ["i18n"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:extra:gate` on main @ `ee595ccb75` reports
`i18n novel 0/0 (pinned), total 8/8, allowed 14/14`. `novel` was burnt to zero
by `burn-down-and-enroll-i18n` (0120), whose acceptance criteria were
`novel: 0` and `noCounterpartFiles: 0` only — the `moved` dimension was never
in that story's scope, so the 8 remaining are unowned. RFC 0193's Verification
clause asks for "0 novel and 0 moved in `parity:api:extra --package <pkg>`",
so i18n is the one package in the RFC still short of it.

`pnpm parity:api:extra --package i18n` places them:

| TS file                                   |                             moved |
| ----------------------------------------- | --------------------------------: |
| `packages/i18n/src/backend/key-value.ts`  | 4 (`get`, `keys`, `set`, `Store`) |
| `packages/i18n/src/locale/fallbacks.ts`   |                 2 (`get`, `name`) |
| `packages/i18n/src/locale/tag/parents.ts` |                2 (`toA`, `toSym`) |

A `moved` name is one Rails/the gem does define, in a different `.rb`. So each
is either (a) in the wrong file and belongs in the one mirroring the `.rb` that
defines it, or (b) a real counterpart the conventions tables fail to pair —
check `PATH_SEGMENT_ALIASES` / `RUBY_FILE_TS_OVERRIDES` in
`scripts/parity/conventions.ts` before concluding either way, per the 0120
story's own warning for this package.

`key-value.ts`'s four are the `Store` interface and its three members
(`:17-21`), which mirror the store contract documented at
`vendor/i18n/v1.14.8/lib/i18n/backend/key_value.rb:26-30` (`store#[]`,
`store#[]=`, `store#keys`) rather than any `def` in that file — so they may be
the (b) case and want an interface-kind exemption or a receipt, not a move.

## Converged shape

`parity:api:extra --package i18n` reports 0 novel and 0 moved, each of the 8
having been relocated to the file mirroring the `.rb` that defines it, paired
by a conventions-table fix, or receipted at its declaration with
`@noRailsEquivalent PERMANENT|CONVERGEABLE <story-id>`. `extra-surface-mark.json`'s
i18n row is then tightened with `pnpm parity:api:extra:tighten` — never widened.

## Acceptance criteria

- [ ] `total` for i18n reaches 0 and the mark is tightened, not raised.
- [ ] Each of the 8 is resolved by a move, a conventions-table pairing, or a
      receipt — and the choice is stated per name in the PR body.
- [ ] `pnpm parity:api:extra:gate` stays green; `allowed` does not grow.
