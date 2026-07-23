---
title: "dirty-residual-skip-tail"
status: done
updated: 2026-07-23
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 6
pr: 5130
claim: "2026-07-23T11:52:39Z"
assignee: "dirty-residual-skip-tail"
blocked-by: null
closed-reason: null
---

## Context

7 skipped matched tests remain in `dirty.test.ts` after 0030
unskip-dirty-tracking (done): :490 (string attribute should compare with
typecast symbol after update), :810 (field named field), :880 (in place
mutation detection), :886 (in place mutation for binary), :923 (changes is
correct if override attribute reader), :988 (mutating and then assigning
doesn't remove the change), :993 (getters with side effects are allowed).
Rails: `vendor/rails/activerecord/test/cases/dirty_test.rb`. The in-place
mutation family may be partially portable via mutable analogues (arrays/Data);
JS string immutability makes some genuinely impossible — those should be
reclassified permanent-skip rather than sit as counted skips.

## Acceptance criteria

- Each of the 7 is passing un-skipped or reclassified with justification.
- `--incomplete` Skip count for dirty_test.rb reaches 0.
