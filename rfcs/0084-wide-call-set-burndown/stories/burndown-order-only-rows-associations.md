---
title: "Converge the order-only call rows in associations/** to Rails' branch order"
status: done
updated: 2026-08-07
rfc: "0084-wide-call-set-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: 6166
claim: "2026-08-07T02:48:26Z"
assignee: "attribute-activesupport-json-singleton-members-to-json-ts"
blocked-by: null
closed-reason: null
---

## Context

PR #6152 taught the call ratchet to compare call SEQUENCES, not just sets, and
seeded the 188 order-only rows it surfaced into
`scripts/api-compare/call-mismatches-exclude/` (keys prefixed `order:`, each
carrying an ordering-specific reason). That baseline is a burndown ledger, not
permission: every row says the port makes exactly the calls Rails makes, but in
a different sequence — i.e. CLAUDE.md's "same branches, in the same order, with
the same guards and early returns" is violated in a body the set diff called
clean.

Concentration (`grep -rl '"call": "order:' call-mismatches-exclude/`):
activerecord 142, actiondispatch 14, activesupport 10, rack 5, arel 3,
activemodel 3, trailties 3, and single digits elsewhere. The activerecord half
is dominated by `associations/**`.

Worked example confirming these are real, not comparator noise —
`associations/belongs-to-association.ts::handleDependency` vs
`vendor/rails/activerecord/lib/active_record/associations/belongs_to_association.rb:7-30`:
Rails reaches `target.destroy` in the `:destroy` arm (`rb:12`) BEFORE it touches
`reflection` (`rb:14`, the `:destroy_async` arm); the port reads
`this.reflection.options.dependent` up front and drops the `destroy_async` arm
entirely, so the two orderings differ because a whole Rails branch is missing.
The row is `order:reflection,destroy → destroy,reflection`.

Scope this story to ONE coherent slice (suggest `associations/**`) rather than
the whole ledger; file siblings for the other clusters.

## Acceptance criteria

- [ ] For each `order:` row in the chosen slice, read the Rails body at its
      `file:line` and converge the TS body's branch/call order to it — including
      restoring a dropped branch where that is the cause, as in the
      `handle_dependency` example.
- [ ] Each converged row is DELETED from its `call-mismatches-exclude/` shard by
      hand (the baseline is only-shrink; a converged row goes STALE and reds the
      gate). Do NOT `--write`/reseed — it rewrites the whole tree and buries the
      rows you retired.
- [ ] No row is closed by rewording its reason, and no new `order:` row is added
      for the code you are changing.
- [ ] Any re-sorting of a shard uses `compareKeys` (code-unit), not
      `localeCompare` — the latter mis-collates keys differing past punctuation
      (`joins!` vs `joins_values`) and reds the reseed-drift gate.
- [ ] `pnpm parity:api:calls` green and the AR suites pass on all three adapter lanes.
