---
title: "ruby-compat's extra-surface mark needs a growth protocol: its extra surface is inventory, not debt"
status: ready
updated: 2026-09-17
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: "measurement"
packages:
  - "ruby-compat"
deps: []
deps-rfc: []
est-loc: 220
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ruby-compat` is enrolled in the RFC 0117 extra-surface ratchet
(`GATED_PACKAGES` in `scripts/api-compare/extra-surface-mark.ts`, row
`{"novel": 0, "total": 52}` in `scripts/api-compare/extra-surface-mark.json`),
and it is in `TAGGED_ONLY_PACKAGES` alongside `arel`
(`extra-surface-mark.ts:121`).

That enrollment is deliberate and should stay. `ruby-compat` is in
`TS_ONLY_PACKAGES`, not `PACKAGES` (`scripts/api-compare/config.ts:34`), so the
Rails comparison never scores it — no coverage, arity, call parity, param
names, or source order. `parity:api:extra` is enrolled for a different reason,
stated at `config.ts:20-33`: every TS file in the package lands in the
`rubyFile === null` slice, so the count is "how much MRI surface has been
ported", and it is the only mechanical enforcement of the package's rule 1
("Only what trails actually calls", `packages/ruby-compat/README.md`).

The problem is the ratchet's **direction**. For a Rails package, extra surface
is debt, so only-shrink is correct: `parity:api:extra:tighten` writes each
dimension DOWN and never up, and there is deliberately no reseed (CLAUDE.md,
"Did you add any public TS name?"). For `ruby-compat`, extra surface is
**inventory** — the package's job is to grow every time trails needs another
piece of Ruby. The two signs are opposite, and `ruby-compat` inherited the
wrong one.

Consequence: every remaining `move-*-to-ruby-compat` story under this RFC
raises `total` and reds `parity:api:extra:gate` with no sanctioned way up.
The queued ones include `move-monitor-mixin-to-ruby-compat`,
`move-regexp-escape-to-ruby-compat`, `move-range-core-and-succ-to-ruby-compat`,
`move-crypto-adapter-into-ruby-compat`, `move-fs-adapter-into-ruby-compat-as-a-backend-contract`,
`move-ruby-inspect-and-compact-uniq-to-ruby-compat`,
`port-file-fnmatch-onto-ruby-compat-file`, and
`port-file-symlink-p-onto-ruby-compat-file`.
`move-big-decimal-to-ruby-compat` depends on this story for the same reason.

Note that `TAGGED_ONLY_PACKAGES` does not rescue this: tagged-only mode does
not drop `total` (a receipt re-enters the member as `Allowed` rather than
removing it from the count), so receipting every moved export still raises
`total`.

`move-rational-to-ruby-compat` (done, trails#7240) landed while the mark was
still being seeded and so never hit this wall.

## Acceptance criteria

- `ruby-compat`'s extra-surface mark can be raised by a story that is
  legitimately adding MRI surface, through an explicit, reviewed protocol —
  not by the only-shrink `tighten` path and not by a blanket reseed.
- The raise is gated on the thing that actually matters for this package:
  each newly counted export carries a `@noRailsEquivalent PERMANENT — Ruby core`
  receipt (or the package's established receipt shape) AND a real call site
  elsewhere in the repo, i.e. rule 1 stays mechanically enforced rather than
  becoming review-by-vibes.
- The Rails packages' only-shrink contract is untouched. Whatever shape the
  growth protocol takes, it is scoped to `ruby-compat` (and is not reachable
  from `activerecord`, `arel`, or any package in `PACKAGES`).
- `arel` is considered explicitly and left alone unless there is a reason to
  change it: it is in `TAGGED_ONLY_PACKAGES` too but IS a Rails package, so its
  extra surface is debt and only-shrink remains correct there.
- `parity:api:extra:gate` is green with the protocol in place, and a raise that
  omits a receipt or a call site still reds.
- The mechanism is documented where a future agent will find it: the
  `ruby-compat` README's contract section and the CLAUDE.md extra-surface
  paragraph, both of which currently state only-shrink without exception.
