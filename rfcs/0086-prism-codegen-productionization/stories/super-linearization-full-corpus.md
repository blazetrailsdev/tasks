---
title: "Index the whole AR include list, not just TARGET_FILES"
status: closed
updated: 2026-08-05
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded by the 2026-08-05 prism-codegen coverage audit: the generator is being retired (0084-wide-call-set-burndown/retire-prism-codegen-tooling), so improving its output is work on a deleted directory. Evidence: 0 shipped lines from codegen:apply, 963 tsc errors across all 10 emitted files, 81.8% whole-corpus node coverage that does not translate to usability."
---

## Context

`buildLinearization` in `scripts/prism-codegen/linearization.ts` indexes only
the 10 entries of `TARGET_FILES` (`golden.ts:targetLinearization`), so a
`super` whose real next definer lives in an unindexed AR module declines as
`__PRISM_SUPER_OUTSIDE_CORPUS` even though Ruby resolves it inside
ActiveRecord. The goldens show this: `Core::ClassMethods#find`,
`Core::ClassMethods#find_by` and `Core::ClassMethods#inspect` all decline,
but `vendor/rails/activerecord/lib/active_record/base.rb:299-332` includes
several modules the target set does not cover.

The decline is safe (never a wrong target), but it caps how many supers the
codegen can realize and how much the conformance scorer can credit.

## Acceptance criteria

- The def index is built over the vendored AR lib modules named by
  `base.rb`'s include list, not just `TARGET_FILES`.
- The ancestry stays exactly `base.rb`'s reversed include order; modules with
  no vendored source still decline rather than guess.
- Goldens re-recorded; the guard's residue count moves deliberately, with
  newly-clean defs either converged or reviewed (baseline vs signoff).
