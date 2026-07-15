---
title: "attribute.test.ts: resolve duplicate it() names within #eq, #matches_all, #eq_all"
status: draft
updated: 2026-07-15
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by review of PR #4886. That PR found `describe("#not_in")` in
`packages/arel/src/attributes/attribute.test.ts` held six tests, two of which
were mis-nested `#in` tests (calling `.in()`) that duplicated
`describe("#in")`. Rails has exactly one `describe "#in"`
(attribute_test.rb:721) and one `describe "#not_in"` (946), so #4886 deleted
the mis-nested trio after folding their stronger `compile()` assertions into
`describe("#in")`.

The same class of defect remains in three other blocks in that file — exact
duplicate `it()` names within a SINGLE describe, which the convention permits
only across different describe blocks:

- `#eq` — `"should handle nil"` x2
- `#matches_all` — `"should not eat input"` x2
- `#eq_all` — `"should create a Grouping node"` x2,
  `"should generate ANDs in sql"` x2

Reproduce on main:

```sh
python3 - <<'PY'
import re, collections
t = open('packages/arel/src/attributes/attribute.test.ts').read()
for b in re.split(r'  describe\("', t)[1:]:
    name = b.split('"')[0]
    its = re.findall(r'    it\("([^"]+)"', b)
    dups = [k for k, v in collections.Counter(its).items() if v > 1]
    if dups:
        print(name, '->', dups)
PY
```

A duplicate slot is either a redundant test or a mis-nested one whose assertion
belongs elsewhere — #4886's `#not_in` case was the latter, and deleting it
blind would have dropped the only `compile()` coverage for that path. So each
pair needs checking against the Rails block before removal, not a bulk delete.

Test names must NOT be renamed (test:compare matches on them), so the fix is to
delete the redundant slot or re-nest it under the correct describe, folding in
any assertion the surviving slot lacks.

## Acceptance criteria

- [ ] Each duplicate pair in `#eq`, `#matches_all`, `#eq_all` is checked
      against the corresponding Rails block in
      `vendor/rails/activerecord/test/cases/arel/attributes/attribute_test.rb`.
- [ ] Redundant slots are deleted; mis-nested slots move to the describe whose
      method they exercise. No test is renamed or reworded.
- [ ] Any assertion unique to a deleted slot is folded into the survivor first,
      so no coverage is lost.
- [ ] The reproduce script above reports no duplicates for these blocks.
- [ ] test:compare matched count does not drop (extras may fall).
