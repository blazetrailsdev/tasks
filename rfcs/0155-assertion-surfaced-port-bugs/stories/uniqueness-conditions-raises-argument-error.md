---
title: "UniquenessValidator: raise ArgumentError with Rails' message for non-callable :conditions"
status: draft
updated: 2026-09-21
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`UniquenessValidator#constructor` (`packages/activerecord/src/validations/uniqueness.ts:26-31`) raises a plain `Error` with the message "... Pass a callable instead: `conditions: () => where({ approved: true })`". Rails raises `ArgumentError` with "#{options[:conditions]} was passed as :conditions but is not callable. Pass a callable instead: `conditions: -> { where(approved: true) }`" (`activerecord/lib/active_record/validations/uniqueness.rb:7-10`). The trails test `validate uniqueness with non callable conditions is not supported` asserts a bare `toThrow()`, where Rails' `uniqueness_validation_test.rb:526-530` asserts `assert_raises(ArgumentError)`. #7921 converged the sibling `:scope` message (`uniqueness.rb:12`), but not this one.

## Acceptance criteria

- The constructor raises `ArgumentError` (from `@blazetrails/activemodel`) with Rails' message text.
- The test asserts `toThrow(ArgumentError)`.
