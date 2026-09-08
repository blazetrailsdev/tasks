---
title: "Expand CONST hash loop receivers in the Ruby test extractor"
status: draft
updated: 2026-09-08
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

After #7625 taught `scripts/test-compare/extract-ruby-tests.rb` to expand
hash-literal loop receivers, the remaining unexpandable loops all share ONE
shape: a receiver that is a CALL CHAIN rather than a literal or a same-file
`CONST = [...]`. `pnpm parity:test` reports them per package
(`<pkg>: N define_method loops not statically expandable`) — activesupport 14,
activerecord 11, actioncontroller 2, actionview 2 at the time of filing.

The canonical instance is
`vendor/rails/activesupport/test/inflector_test.rb:68`:

```ruby
ActiveSupport::Inflector.inflections.uncountable.each do |word|
  define_method "test_uncountability_of_#{word}" do
```

whose receiver is a runtime value, not a literal — so it is NOT statically
expandable and must keep falling through to `report_unexpanded_loop`. Run the
report first and separate the two populations before writing code: the loops
whose receiver names a same-file constant of a shape `loop_elements` does not
yet resolve (a `CONST = { ... }` hash, a frozen/`.freeze`d literal, a constant
built by `%w` inside a method) are convergeable; the ones reading library state
are not, and no amount of machinery makes them so.

Existing machinery to extend, all in `extract-ruby-tests.rb`:
`loop_elements` (array literal, hash literal, `@const_arrays`),
`collect_const_arrays` (which today records only `CONST = [...]`, so a
`CONST = { ... }` hash is invisible), `array_element_value` /
`hash_literal_pairs`, and `eval_loop_expr`.

This lands under RFC 0139 because the fidelity-tooling RFCs (0126, 0092) are
closed and #7625's hash arm landed here for the same reason; it is not
journey-specific work.

## Acceptance criteria

- `collect_const_arrays` also records `CONST = { ... }` hash constants, and
  `loop_elements` resolves them, with cases in
  `scripts/test-compare/extract-ruby-test-macro-loop.test.ts` or its
  `define_method` sibling.
- Every loop whose receiver is genuinely a runtime value still reports through
  `report_unexpanded_loop` — no partial emission.
- All-package before/after in the PR body showing the unexpandable counts drop
  and no package's `extra` count rises, as #7608 and #7625 did.
