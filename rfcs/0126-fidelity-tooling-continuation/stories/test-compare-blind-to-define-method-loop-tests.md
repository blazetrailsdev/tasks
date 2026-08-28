---
title: "test-compare-blind-to-define-method-loop-tests"
status: in-progress
updated: 2026-08-28
rfc: "0126-fidelity-tooling-continuation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 7147
claim: "2026-08-28T01:43:26Z"
assignee: "test-compare-blind-to-define-method-loop-tests"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test` reports `arel` at 707/707 (100%) with `59/59 files`. For
`vendor/rails/activerecord/test/cases/arel/visitors/dot_test.rb` the Ruby
manifest (`scripts/test-compare/output/rails-tests.json`,
`packages.arel.files[].file == "visitors/dot_test.rb"`) holds **15**
`def_test` cases. The file defines **47**: the other 32 are produced by

```ruby
[Nodes::Sum, Nodes::Exists, …].each do |klass|
  define_method("test_#{klass.name.gsub('::', '_')}") do … end
end
```

at `dot_test.rb:18-30`, `:39-55`, `:58-81`, `:84-93`. The extractor
(`scripts/test-compare/extract-ruby-tests.rb`) sees `def test_…`, `test "…"`
and `it "…"` and nothing else, so a Rails file whose cases are generated
scores 100% against a TS twin missing two thirds of them
(`packages/arel/src/visitors/dot.test.ts` has 15).

Rails uses this shape elsewhere too (a grep for `define_method("test_` over
`vendor/rails/*/test` will size it), so every enrolled package's percentage
is inflated by however many of these its files contain, and the
`rails-test-name-parity` ratchet cannot flag a TS `it` that ports one of them
because the Rails name is not in `eslint/rails-test-names.json`.

## Acceptance criteria

- The Ruby extractor expands `[…].each do |klass| define_method("test_#{…}")`
  loops whose receiver is a literal array of constants, emitting one
  `def_test`-style case per element with the name the interpolation would
  produce (`test_Arel_Nodes_Sum` → `"Arel Nodes Sum"`), tagged
  `style: "define_method"` so the report can count them separately.
- Loops it cannot expand statically are reported (file:line) rather than
  silently dropped.
- `pnpm parity:test` shows the new Rails totals; arel's `visitors/dot_test.rb`
  goes from 15 to 47 cases and the percentage drop is visible in the run
  that lands this (the arel case restoration is the sibling story
  `arel-dot-test-drops-define-method-cases-and-namespaced-labels`, RFC 0124).
- `eslint/rails-test-names.json` includes the expanded names so the
  name-parity ratchet credits their TS ports.
