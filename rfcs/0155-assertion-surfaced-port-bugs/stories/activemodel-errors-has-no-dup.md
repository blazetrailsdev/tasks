---
title: "activemodel-errors-has-no-dup"
status: done
updated: 2026-09-23
rfc: "0155-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#7989
claim: "2026-09-22T23:11:04Z"
assignee: "abstract-adapter-inspect-renders-role-shard-as-strings"
blocked-by: null
closed-reason: null
---

## Context

Surfaced converging `errors_test.rb`'s assertions (RFC 0132,
`assertions-activemodel-errors-cluster`).

`ActiveModel::Errors#initialize_dup`
(`vendor/rails/activemodel/lib/active_model/errors.rb:122-125`) gives a duped
`Errors` a `deep_dup`ed `@errors` array, so `errors.dup` is a real Rails API.
`packages/activemodel/src/errors.ts` has `copyBang` (`copy!`) but neither `dup`
nor `initializeDup`, so three converged tests have no way to spell the Rails
body.

Parked `it.skip` with `BLOCKED: activemodel-errors-has-no-dup` in
`packages/activemodel/src/errors.test.ts`:

- `dup` (`errors_test.rb:70-75`) — `assert_not_same errors_dup.errors, errors.errors`
- `dup duplicates details` (`errors_test.rb:592-598`) —
  `assert_not_equal errors_dup.details, errors.details`
- `merge does not import errors when merging with self` (`errors_test.rb:660-668`) —
  `assert_equal errors.errors, errors_before_merge.errors`

Each body is converged (same count, same kinds, same expected values as Rails)
and reaches `dup()` through a `as unknown as { dup(): Errors<Person> }` cast so
the file typechecks while skipped.

## Acceptance criteria

- `Errors#initializeDup` ports `errors.rb:122-125` and `Errors#dup` is callable.
- The three tests above are un-skipped, the casts removed, and they pass.
