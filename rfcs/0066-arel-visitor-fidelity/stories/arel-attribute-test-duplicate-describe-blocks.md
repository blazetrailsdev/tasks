---
title: "attribute.test.ts: consolidate 30 excess duplicate describe blocks against Rails"
status: in-progress
updated: 2026-07-22
rfc: "0066-arel-visitor-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 400
priority: 55
pr: 5057
claim: "2026-07-22T14:41:49Z"
assignee: "arel-attribute-test-duplicate-describe-blocks"
blocked-by: null
closed-reason: null
---

## Context

PR #5014 resolved duplicate `it()` names _within_ a single `describe` in
`packages/arel/src/attributes/attribute.test.ts`. It deliberately left the
duplicate `describe` blocks alone (the reviewer scoped `#matches_any` at
:407/:421 out). That residue is larger than one pair.

Counting `describe` blocks in the trails file against
`vendor/rails/activerecord/test/cases/arel/attributes/attribute_test.rb`
(on merged `main`):

| describe                                                                                              | trails | rails | excess |
| ----------------------------------------------------------------------------------------------------- | ------ | ----- | ------ |
| `#not_between`                                                                                        | 7      | 1     | 6      |
| `#not_in`                                                                                             | 5      | 1     | 4      |
| `#lteq`                                                                                               | 4      | 1     | 3      |
| 17 others (`#gt`, `#eq`, `#matches`, `#matches_any`, `#eq_any`, `#in_any`, `#overlaps`, `#to_sql`, …) | 2      | 1     | 1 each |

**30 excess blocks in total.** Rails has exactly one `describe` per name here
(the sole exception is `#eq_all`, which legitimately has two — rb:441 and
rb:1037 — and is already correct after #5014).

The usual justification for a same-named split does **not** apply: trails
splits Rails test classes across same-named `describe`s for fixture-set/table
isolation, but this is an arel unit-test file with no fixtures and no handler,
so the blocks are simply accreted copies.

This matters beyond tidiness — it is an active defect generator. Each of the
three review rounds on #5014 was the same root cause: work landed in one block
while an equivalent block already existed elsewhere in the ~1700-line file,
producing 3rd and 4th copies of `#not_in_any`/`#not_in_all` and two
byte-identical `#eq_all` blocks. It also inflates `test:compare` "extra"
counts (627 extras for arel at time of writing).

Reproduce:

```sh
python3 - <<'PY'
import re, collections
ts = open('packages/arel/src/attributes/attribute.test.ts').read()
rb = open('vendor/rails/activerecord/test/cases/arel/attributes/attribute_test.rb').read()
t = collections.Counter(re.findall(r'  describe\("([^"]+)"', ts))
r = collections.Counter(re.findall(r'describe "([^"]+)" do', rb))
for k, v in sorted(t.items(), key=lambda x: -(x[1] - r.get(x[0], 0))):
    if v > r.get(k, 0):
        print(f"{k:<22}{v:>4}{r.get(k, 0):>4}{v - r.get(k, 0):>4}")
PY
```

## Acceptance criteria

- [ ] Each duplicated `describe` in `attribute.test.ts` is consolidated to one
      block per Rails `describe`, matching Rails' count and ordering.
- [ ] Consolidation follows #5014's method: check each block against the Rails
      source, keep the assertion that is strictly stronger (exact `to_sql` over
      `toContain`), fold in anything unique to a dropped block, and delete
      blocks whose bodies never call the method the `describe` names.
- [ ] No test is renamed or reworded (`test:compare` matches on names).
- [ ] The `relationName` describe (1 trails / 0 Rails) is a TS-only extra —
      move it to `attribute.trails.test.ts` rather than deleting it.
- [ ] `test:compare` matched count for arel does not drop; extras fall.
- [ ] Likely exceeds the 500 LOC ceiling as one PR — split by describe group
      (e.g. `#not_between` + `#not_in` + `#lteq` first, then the 1-excess
      tail) and register each split as its own story from `main`.

Related: this is the file-level generalisation of
`arel-attribute-test-duplicate-it-names-within-describe` (#5014).
