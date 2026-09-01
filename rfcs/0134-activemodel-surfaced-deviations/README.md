---
rfc: "0134-activemodel-surfaced-deviations"
title: "ActiveModel surfaced deviations — silent body divergences, unreceipted inventions, and receipt hygiene from the 2026-09-01 fidelity audit"
status: draft
created: 2026-09-01
updated: 2026-09-01
owner: "@deanmarano"
packages:
  - "activemodel"
clusters:
  - "rails-deviation"
  - "invented-arm"
  - "guard-parity"
  - "receipt-hygiene"
  - "test-placement"
related-rfcs:
  - "0115-activemodel-fidelity-convergence"
  - "0131-activemodel-activerecord-api-parity-100"
  - "0124-arel-surfaced-deviations"
  - "0126-fidelity-tooling-continuation"
  - "0129-ruby-compat"
priority: 3
---

# RFC 0134 — ActiveModel surfaced deviations

The `activemodel-surfaced-deviations` bucket, seeded from the activemodel
fidelity audit
(`~/.btwhooks/data/github/blazetrailsdev/trails/audits/activemodel-fidelity-20260901T135335Z.md`),
mirroring what 0124 did for arel. Every story carries the trails and Rails
`file:line` verified against the tree on 2026-09-01.

## Summary

activemodel measures well — 737/754 methods (97.7%), 963/963 test parity, 321/321
parameter names, 0 gated call-arg rows — but a line-by-line read of 12 files
found debt the numbers do not show:

- **Silent behavioral divergences**: `Errors#asJson` drops the `full_messages`
  option; every `Dirty` dispatch target resolves attribute aliases where Rails
  passes `attr_name.to_s` raw; `builder.ts` invents a `?? defaultValue()` type
  fallback where Rails would fail loudly.
- **A ratified-rule violation**: `Attribute#withUserDefault` guards a slot read
  with an invented throw, which CLAUDE.md's "Call-time constant resolution"
  section explicitly bans.
- **Unreceipted invented surface**: 50 novel names, ~24 of them one decision —
  the `Type`/`ValueType` split plus a per-subclass `name` property — the
  blocker for ever enrolling activemodel in `parity:api:extra:gate`.
- **Receipt hygiene**: 3 free-prose `@noRailsEquivalent` receipts (claims true,
  shape illegal) and 1 duplicated tag.

## Scope

Stories whose SUBJECT is activemodel. Work already owned elsewhere stays there:
the 14 DeclOnly parity misses and `gem_version.rb` belong to RFC 0131; the
`type_for_attribute → fetch` baseline row is owned by
`burn-down-rfc0126-repairing-surfaced-call-rows` (RFC 0126); the
`transformValues` rubyCompat row converges under RFC 0129's delegate-hash
story. This RFC does not duplicate those.

## Rules

Standard deviation-convergence discipline (CLAUDE.md "A documented deviation is
debt, not permission"): every story converges or `tasks block`s with a specific
blocker; none closes by writing a better justification, widening a baseline, or
moving the deviation to a different register. Regression tests must fail on the
baseline before the fix.
