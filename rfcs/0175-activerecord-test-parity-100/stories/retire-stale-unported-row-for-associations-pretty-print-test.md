---
title: "activerecord: associations_test pretty_print test is ported; retire its unported-files row that says PP has no equivalent"
status: draft
updated: 2026-10-08
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
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

Surfaced after trails PR 8684 moved the pretty printer into ruby-compat (`packages/ruby-compat/src/pp.ts`,
the port of `vendor/ruby/v3.3.11/lib/pp.rb`).

`scripts/parity/unported-files/unscoped.ts` carries a row for `associations_test.rb`, test
`pretty print does not reload a not yet loaded target`, with the reason "Ruby's pretty-printer has no
Node.js equivalent; the inspect-without-reload behavior is covered by the inspect test."
`scripts/parity/unported-files/baseline.json` carries the matching row.

That reason is false now. `PP.pp` exists, and the test is already ported in
`packages/activerecord/src/associations.test.ts` as
`it("pretty_print does not reload a not yet loaded target")`, calling `PP.pp(andreas.auditLogs, out)`.

The Rails test is `test_pretty_print_does_not_reload_a_not_yet_loaded_target`
(`vendor/rails/v8.0.2/activerecord/test/cases/associations_test.rb:559-566`):

```ruby
andreas = Developer.new(log: "new developer added")
assert_not_predicate andreas.audit_logs, :loaded?
out = StringIO.new
PP.pp(andreas.audit_logs, out)
assert_match(/message: "new developer added"/, out.string)
assert_predicate andreas.audit_logs, :loaded?
```

Two things to settle:

- The excluded row should go, from both `unscoped.ts` and `baseline.json` (retiring one without the
  other reds the Unit Tests job).
- The trails `it` name must be the one `parity:test` matches to the Rails name. Rails'
  `test_pretty_print_does_not_reload_…` maps to "pretty print does not reload …"; the trails test is
  spelled `pretty_print does not reload …`. Check with `pnpm parity:test` whether it credits, and if
  it does not, find out why before touching the name.
- The trails body passes a `{ write }` closure where Rails passes a `StringIO` and reads `out.string`.
  ruby-compat's `StringIO` answers `write` and `string()`, so the body can be Rails' line for line.

## Acceptance criteria

- [ ] The `associations_test.rb` "pretty print does not reload a not yet loaded target" row is deleted from `scripts/parity/unported-files/unscoped.ts` and `baseline.json`.
- [ ] `pnpm parity:test` credits the trails test against `associations_test.rb:559`.
- [ ] The test body builds a `StringIO`, calls `PP.pp(andreas.auditLogs, out)` and matches `out.string()`, with Rails' three assertions in Rails' order.
- [ ] `pnpm vitest run packages/activerecord/src/associations.test.ts -t "pretty_print does not reload"` is green.
