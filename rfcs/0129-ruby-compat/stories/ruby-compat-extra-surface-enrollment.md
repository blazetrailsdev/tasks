---
title: "Enroll ruby-compat in the extra-surface gate so the only-what-we-call rule is mechanical, not reviewed"
status: ready
updated: 2026-08-30
rfc: "0129-ruby-compat"
cluster: null
packages: ["ruby-compat"]
deps: ["ruby-compat-package-skeleton"]
deps-rfc: []
est-loc: 130
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The package's defining constraint is that **no member exists without a real call
site in this repo**. A Ruby-core package is uniquely exposed to scope creep — MRI's
surface is enormous and every member of it is defensibly "real Ruby" — and the
`SKIP_GROUPS` discipline that keeps other packages honest does not apply, because
there is no Ruby file to be measured against. So the constraint has to be enforced
by a counter.

`scripts/api-compare/extra-surface.ts` walks from each Ruby file to its expected TS
file; a TS file with no Ruby counterpart lands in the `rubyFile === null` slice
(`extra-surface.ts:531`) and every public name in it is scored **novel**. That is
the whole of ruby-compat by construction, which makes the extra-surface counter an
exact proxy for "how much MRI surface have we ported".

`scripts/api-compare/extra-surface-mark.ts:50` holds
`GATED_PACKAGES = ["arel", "activerecord"]`, read against
`extra-surface-mark.json` (`arel: {novel: 0, total: 35}`,
`activerecord: {novel: 355, total: 959}`). The gate is only-shrink;
`parity:api:extra:tighten` writes marks DOWN and there is no reseed
(`extra-surface-mark.ts:144-149` refuses an unseeded gated package, so the two
edits must land together).

**Coordinate with RFC 0025's `triage-no-counterpart-extra-surface-population`
(ready).** That story triages exactly the `rubyFile === null` slice ruby-compat
lands in, and a package arriving in that slice mid-triage will move its numbers.
Check its state before seeding, and if it is in flight, say so in the PR body and
agree the ordering rather than racing it.

Do this immediately after the skeleton, while the mark is 0/0. Enrolling later
means seeding a non-zero mark, and a non-zero seed is a licence to sit at it.

## Acceptance criteria

- `ruby-compat` added to `GATED_PACKAGES` with its mark seeded in
  `extra-surface-mark.json` in the SAME commit (an unseeded gated package
  disarms the gate — `extra-surface-mark.ts:144-149`).
- Seeded at the package's actual measurement at the time of the PR, which after
  the skeleton story is `{novel: 0, total: 0}`.
- `pnpm parity:api:extra:gate` green; `pnpm parity:api:extra --package ruby-compat`
  reports the enrolled numbers.
- `extra-surface-mark.test.ts` extended to cover the new package the way it
  covers `arel`.
- The package README's standing-rule section (from the skeleton story) updated
  to name this gate as the enforcement mechanism, and to state that a later
  need is a later story filed against this RFC with its motivating call site —
  never a drive-by addition to a move PR.
- Documented in the story/PR body: adding a speculative member raises `novel`
  and turns this gate red, and there is no reseed.
