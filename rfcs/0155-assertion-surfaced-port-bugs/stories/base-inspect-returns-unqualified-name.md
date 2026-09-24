---
title: "base-inspect-returns-unqualified-name"
status: done
updated: 2026-09-24
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: trails#8046
claim: "2026-09-24T18:14:09Z"
assignee: "attribute-assignment-argument-error-names-js-number-not-integer"
blocked-by: null
closed-reason: null
---

## Context

Parked by assertions-tail-root-4 in `packages/activerecord/src/core.test.ts` ("inspect class", `it.skip`).

Rails `activerecord/test/cases/core_test.rb:14-18` asserts `ActiveRecord::Base.inspect == "ActiveRecord::Base"`. trails `Base.inspect()` (`packages/activerecord/src/base.ts:2534`) returns `this.name`, i.e. `"Base"`. Cause not otherwise investigated; the `LoosePerson(abstract)` and `Topic(...)` assertions in the same test were not run separately.

## Acceptance criteria

- `Base.inspect()` returns `"ActiveRecord::Base"` per core.rb.
- Un-skip "inspect class" in core.test.ts.
