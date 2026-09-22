---
title: "activerecord-record-undefined-name-does-not-raise-no-method-error"
status: draft
updated: 2026-09-22
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced parking `attribute_methods_test.rb` for `park-0155-owned-activerecord-residue`.
Three Rails tests assert `NoMethodError` from reading or writing a name that is not an attribute
method, raised by `BasicObject#method_missing` after ActiveRecord's
`ActiveModel::AttributeMethods#method_missing` (`activemodel/lib/active_model/attribute_methods.rb:515-526`)
declines it:

- `attribute keys on a new instance` (`vendor/rails/activerecord/test/cases/attribute_methods_test.rb:163-167`) — `t.title2`
- `non-attribute read and write` (`:641-646`) — `topic.mumbo`, `topic.mumbo = 5`
- `undeclared attribute method does not affect respond_to? and method_missing` (`:648-654`) — `topic.title_hello_world`

In trails an unknown name on a record reads `undefined` or creates an own property, so each
converged `assertRaises([NoMethodError], …)` fails. The bodies are converged and parked in
`packages/activerecord/src/attribute-methods.test.ts` with `BLOCKED:` lines naming this story.

CLAUDE.md § "Records are not Proxies" records the measured cost blocker (a constructor-returned
`Proxy` is 3.7×–64× slower on reads) and says there is no story to proxy records.

## Acceptance criteria

- The RFC owner decides: either a runtime carrier for `method_missing` on records lands and the three
  tests are un-skipped and pass, or the story is closed and the three tests are converted to
  `PERMANENT-SKIP` citing that CLAUDE.md section.
