---
title: "Expand hash-literal loop receivers in the Ruby test extractor"
status: ready
updated: 2026-09-08
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: 20
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/test-compare/extract-ruby-tests.rb` expands loop-generated Rails tests
statically, but only when the loop's receiver is an **array** literal (or, since
PR #7608, a same-file `CONST = [...]`). A **hash**-literal receiver is reported as
unexpandable, so the whole family collapses and the Rails side under-counts.

Five such loops remain in actiondispatch, and all five are in journey files that
still have open parity stories — `journey-path-pattern-test-parity` and
`journey-router-test-parity`:

- `vendor/rails/actionpack/test/journey/path/pattern_test.rb:16` — a
  `{ path => expected_regexp }.each do |path, expected|` generating
  `define_method(:"test_to_regexp_#{Regexp.escape(path)}")` (11 entries).
- `vendor/rails/actionpack/test/journey/path/pattern_test.rb:40`
- `vendor/rails/actionpack/test/journey/path/pattern_test.rb:64` — same shape,
  `{ path => %w{ names } }`.
- `vendor/rails/actionpack/test/journey/router_test.rb:319` —
  `{ request_path => expected }.each`, interpolating
  `expected.keys.map(&:to_s).join('_')` (3 entries).
- `vendor/rails/actionpack/test/journey/router_test.rb:341` —
  `{ name => [request_path, expected] }.each do |name, (request_path, expected)|`,
  i.e. a hash receiver PLUS a destructured value (2 entries).

The same gap costs activerecord 11 loops, activesupport 14 (`inflector_test.rb`
alone is 8), actioncontroller 2 and actionview 2, so the fix is not
journey-local even though journey is what surfaces it here.

Prior art: `test-compare-blind-to-define-method-loop-tests` (RFC 0126, done,
PR #7147) built the array-literal expansion; #7608 extended the same machinery to
the `test` macro, `CONST = [...]` receivers, nested table rows and destructuring
block parameters. This story is the hash-receiver arm of the same mechanism —
RFC 0126 is closed, so it lands here, where its payoff is.

## Converged shape

In `process_define_method_loop` / `process_test_macro_loop`, extend
`loop_elements` to accept a `:hash` receiver, yielding each pair as a two-element
value so the existing `loop_bindings` destructuring path binds
`|path, expected|` with no further change. Then extend `eval_loop_expr` with the
two evaluators these loops need — `Regexp.escape` on a bound string, and
`.keys.map(&:to_s).join(<literal>)` on a bound hash — keeping its existing
contract that an unresolvable segment returns nil and the loop falls back to
`report_unexpanded_loop`.

Binding a hash value requires `array_element_value`'s hash twin: a
`:bare_assoc_hash` / `:hash` element resolving to its literal keys and values, or
nil when any does not resolve.

## Acceptance criteria

- The five actiondispatch loops above expand; `pnpm parity:test --package
actiondispatch` shows `journey/path/pattern_test.rb` and
  `journey/router_test.rb` with their full Rails test counts rather than the
  collapsed rows.
- A receiver or interpolation that still does not resolve statically continues to
  fall through to `report_unexpanded_loop` — no partial emission.
- Covered by cases in `scripts/test-compare/extract-ruby-test-macro-loop.test.ts`
  (or a define_method sibling), including the destructured-hash-value shape at
  `router_test.rb:341`.
- All-package before/after in the PR body showing no package's `extra` count
  rose, as #7608 did.
