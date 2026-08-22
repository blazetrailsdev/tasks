---
title: "Audit existing @missingRailsCall tags for PERMANENT claims that describe convergeable work"
status: done
updated: 2026-08-22
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: 6855
claim: "2026-08-22T11:50:41Z"
assignee: "api-build-order-row-tag-key-mismatch"
blocked-by: null
closed-reason: null
---

## Context

Raised while migrating call-set baseline rows to `@missingRailsCall` receipts in
PR #6849 (RFC 0106 wave 5), and deliberately left out of that PR's scope.

`#6840` added a permanence-claim contract to `@missingRailsCall`:
`classifyReason` (`scripts/api-compare/missing-rails-call-tags.ts:280-284`)
reads the reason's leading token and `extract-ts-api.ts` throws unless it is
`PERMANENT` or `CONVERGEABLE`. That makes an **unstated** claim countable — the
gap RFC 0080 was built to close.

It does not make a **wrong** claim countable. A tag can satisfy the contract by
opening with `PERMANENT` while its reason actually describes convergeable work,
and nothing detects that. This is precisely the failure the RFC 0080 tag audit
found in the sibling family: **42 of 79 `@noRailsEquivalent` tags described
convergeable surface**, each reason factually accurate about its mechanism and
merely drawing "therefore permanent" from it.

The `@missingRailsCall` population has never had the equivalent audit. It has
also just grown: RFC 0106's burndown converts baseline rows into tags by design,
and #6849 alone minted 26. The rule #6849 applied — and wrote into the six
wave-5 follow-up stories — is:

> A `@missingRailsCall` tag is a receipt for a call trails will **never** make.
> A row whose reason names a future convergence owner stays a **baseline row**,
> because that row is the thing tracking the work.

Tags minted before that rule was articulated were never held to it.

## Converged shape

Audit every `@missingRailsCall` tag in the repo against its reason:

- a reason that names an RFC, a story, or any future convergence owner is
  **`CONVERGEABLE`**, not `PERMANENT` — and, per the rule above, generally
  belongs back in `call-mismatches-exclude/` as a baseline row so the work stays
  tracked;
- a reason resting on a language- or runtime-level fact (`Hash#fetch` on a plain
  object, `Regexp.union`, no threads, no `process.*`, the ratified zero-import
  slot) is correctly `PERMANENT`;
- report the split the way `parity:api:extra` reports the `@noRailsEquivalent`
  one, so the mislabeled count is visible rather than inferred.

Reference points: the 26 tags minted by #6849 are a known-good `PERMANENT`
cohort; the 16 rows it returned to the baseline (RFC 0073/0023/0082/0094) are a
known-good `CONVERGEABLE` cohort. Both are worked examples of the boundary.

## Acceptance criteria

- [ ] Every `@missingRailsCall` tag in the repo has been read against its reason
      and carries the claim its reason actually supports.
- [ ] Tags whose reasons name a future convergence owner are returned to
      `call-mismatches-exclude/` as baseline rows (via `serializeBaseline`, rows
      sorted, no `--write`, no reseed), so the work stays tracked.
- [ ] The mislabeled/unclassified split is reported by a command, not derived by
      hand.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
- [ ] Larger than one PR at the 700 LOC ceiling — ship as sequential
      non-overlapping PRs from `main`, never stacked.
