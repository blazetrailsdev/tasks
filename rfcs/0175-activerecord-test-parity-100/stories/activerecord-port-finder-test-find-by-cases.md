---
title: "activerecord: port finder_test.rb's 19 missing find_by / find by cases"
status: ready
updated: 2026-09-30
rfc: "0175-activerecord-test-parity-100"
cluster: missing-tests
packages: ["activerecord"]
deps: ["port-finder-aggregate-find-by-cluster"]
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test --package activerecord --missing`: `finder_test.rb → finder.test.ts` 226/261, 35 missing.
The find_by family (`vendor/rails/v8.0.2/activerecord/test/cases/finder_test.rb`):

- "find by id with hash"
- "find by title and id with hash"
- "find by array of one id"
- "find by ids"
- "find by on attribute that is a reserved word"
- "find by one attribute with conditions"
- "find by one missing attribute"
- "find by two attributes but passing only one"
- "find by id with conditions with or"
- "find by empty ids"
- "find by records"
- "find_by with hash conditions returns the first matching record"
- "find_by with multi-arg conditions returns the first matching record"
- "find_by with range conditions returns the first matching record"
- "find_by doesn't have implicit ordering"
- "find_by! with hash conditions returns the first matching record"
- "find_by! with non-hash conditions returns the first matching record"
- "find_by! with multi-arg conditions returns the first matching record"
- "find_by! doesn't have implicit ordering"

`port-finder-aggregate-find-by-cluster` (RFC 0023) owns the composed_of hash-condition expansion some of
these need; `finder-find-with-string-ports-findbysql-not-string-id-cast` fixes an already-ported body.

## Acceptance criteria

- [ ] Each case is ported under Rails' name and describe path onto canonical models/fixtures, with Rails' assertion kinds.
- [ ] Behaviour a ported case shows diverging is converged, not skipped.

## Verification

```bash
pnpm parity:test --package activerecord --missing && pnpm parity:test:assertions
```
