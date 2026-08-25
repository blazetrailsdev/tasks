---
title: "resolve-owner-by-static-and-include-graph-instead-of-skipping"
status: done
updated: 2026-08-17
rfc: "0108-call-gate-false-positives"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 6665
claim: "2026-08-17T21:02:59Z"
assignee: "converge-exception-wrapper-traces-partition"
blocked-by: null
closed-reason: null
---

## Context

`precise-call-pairing-key-for-owner-static-and-accessor` (PR #6659) gave the
call-gate row key owner precision, but only in the _negative_ direction: when
`resolveTsOwner` cannot name the TS owner and several declare the name
(`ambiguousTsOwner`), or when several Ruby owners in one file share one TS
member (`ambiguousRubyOwner`), the gates now **record nothing**.

That is the right answer over pairing wrongly, but it is not the converged
shape — it drops **107 comparisons** that a precise resolution would keep
(measured on that PR: 57 from `ambiguousTsOwner`, 50 from
`ambiguousRubyOwner`, of a 1079-row population).

Both dimensions are recoverable from data the extractors already carry and
discard before pairing:

- **static vs instance.** `MethodInfo.isStatic` exists on the TS side
  (`scripts/parity/types.ts:66`). Ruby's side of the same distinction is the
  owner FQN: `ActiveRecord::Persistence::ClassMethods` is the singleton half of
  `ActiveRecord::Persistence` (`persistence.rb:687-692` vs `:900-916`). Pairing
  the `::ClassMethods` owner with the static/top-level-export TS member and the
  bare owner with the prototype member resolves the `_update_record` case
  instead of skipping both arms.
- **owner kind.** `resolveTsOwner` (`compare.ts`) matches only on the Ruby
  class's last path segment, so a method Ruby flattened onto a host through
  `include` (`ActiveRecord::FinderMethods` → TS class `Relation`) never
  resolves. The include graph `buildIncludeGraph` already builds is enough to
  say which TS owner mixes the Ruby module in.

## Converged shape

Resolve the Ruby method to exactly one TS member using owner kind + staticness,
and compare only that member. Keep `ambiguousTsOwner` / `ambiguousRubyOwner` as
the fallback for what still cannot be resolved — the `ownerRecordsNothing`
precedent — rather than as the primary answer.

## Acceptance criteria

- `resolveTsOwner` resolves a Ruby module flattened onto a TS host through the
  include graph, not just by last-path-segment name equality.
- A Ruby `X::ClassMethods` owner pairs with a static / top-level-export TS
  member and the bare `X` owner with the prototype member; neither arm is
  skipped when both resolve.
- The suppressed-comparison count falls materially below 107 (report the number
  in the PR body); rows that surface as a result are converged or baselined
  with a reviewed one-line reason.
- No package's call-mismatch row count rises.
- `scripts/api-compare` unit tests cover both resolutions.
