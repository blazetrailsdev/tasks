---
title: "Track unscope_values for merge-time replay"
status: ready
updated: 2026-06-16
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 50
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced by RFC 0030 story b2-unscope-leftjoins-alias (PR #3420).

Rails `unscope!` records the _original_ unscope arguments in `unscope_values`
(`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:812`,
`self.unscope_values += args`) — storing e.g. `:left_joins` verbatim, before
the `:left_outer_joins` normalization. This is used by relation merging
(`merge` replays `unscope_values` against the merged-in relation) so that an
unscope survives a `.merge`.

trails' `unscopeBang` in
`packages/activerecord/src/relation/query-methods.ts` applies the unscope
effects directly but does not track an `_unscopeValues` field, so merge-time
replay of unscopes is not modeled. The skipped "unscope merging" test in
`packages/activerecord/src/scoping/default-scoping.test.ts` exercises exactly
this gap.

## Acceptance criteria

- [ ] `Relation` tracks `_unscopeValues` mirroring Rails `unscope_values`
      (original args, pre-normalization).
- [ ] `merge` replays `_unscopeValues` against the merged relation, matching
      Rails `relation/merger.rb` unscope handling.
- [ ] Un-skip "unscope merging" in default-scoping.test.ts; it passes on sqlite.
