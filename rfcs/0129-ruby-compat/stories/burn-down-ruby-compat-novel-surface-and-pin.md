---
title: "Burn ruby-compat's 4 novel extra-surface names to zero and pin the package"
status: done
updated: 2026-08-31
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: 25
pr: 7314
claim: "2026-08-31T20:49:55Z"
assignee: "burn-down-ruby-compat-novel-surface-and-pin"
blocked-by: null
closed-reason: null
---

## Context

`ruby-compat-extra-surface-enrollment` is **done** — PR #7283 landed the
tagged-only mode and enrolled ruby-compat in the RFC 0117 extra-surface ratchet.
CLAUDE.md's "Before you open the PR" step 4 now names this RFC as the owner of
the next step:

> A package gets pinned as a reviewed step of its own burndown (the
> `activerecord-extra-surface-receipt-burndown` RFC for activerecord's 342,
> **RFC 0129 for ruby-compat's 4**). That direction is only-grow: no package is
> ever un-pinned to turn a red run green.

No open story covers that 4. Measured on `origin/main` after #7284
(`pnpm parity:api:extra --package ruby-compat`):

```
Package                Files   Novel   Moved   Total Allowed NoCntrp
ruby-compat                7       4      13      17      85      17
```

The four novel names, per the per-file detail:

- `packages/ruby-compat/src/range.ts` — 2 novel (the file reports 2 novel / 9
  moved over `begin`, `excludeEnd`, `caseEquals`, `constructor`, `each`, `end`,
  `equals`, `first`, `isInclude`, `last`, `step`; re-run the report for the
  exact two, it prints novel-first).
- `packages/ruby-compat/src/index.ts` — `succ` (a re-export of
  `string/succ.ts`; the declaration it re-exports may already carry a receipt,
  in which case the fix is at the re-export site, not the declaration — see
  the `parity:api --extra` re-export trap).
- `packages/ruby-compat/src/rb-equal.ts` — `RbEqual`.

None were added by #7284: every member that PR shipped in `hash.ts` carries a
`@noRailsEquivalent PERMANENT` receipt with a `vendor/ruby/hash.c:LINE`
citation, and `hash.ts` does not appear in the per-file detail at all.

Note the ordering constraint: once ruby-compat is pinned, `novel` becomes a
constant 0 regardless of the committed row, so the receipts/deletions must land
BEFORE the pin, not with it.

## Acceptance criteria

- Each of the four novel names is either deleted, folded into a ported member,
  or given a `@noRailsEquivalent PERMANENT|CONVERGEABLE <story-id>` receipt with
  a `vendor/ruby/<file>.c:LINE` citation — the same shape
  `blazetrails/ruby-compat-needs-mri-citation` already enforces on the package.
  A receipt is a receipt, not absolution: prefer deletion where the name has no
  Ruby counterpart at all.
- `pnpm parity:api:extra --package ruby-compat` reports `novel 0`.
- `pnpm parity:api:extra:tighten` narrows the mark; never a reseed, never a
  raise.
- ruby-compat is then added to the pinned set alongside arel, in the same place
  `arel` is pinned, and `pnpm parity:api:extra:gate` reports
  `ruby-compat novel 0/0 (pinned)`.
- `total` stays gated and does not increase.
