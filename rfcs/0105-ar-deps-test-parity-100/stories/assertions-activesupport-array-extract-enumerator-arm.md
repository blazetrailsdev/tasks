---
title: "assertions-activesupport-array-extract-enumerator-arm"
status: done
updated: 2026-08-17
rfc: "0105-ar-deps-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6637
claim: "2026-08-17T10:25:53Z"
assignee: "assertions-activesupport-array-extract-enumerator-arm"
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/core-ext/array/extract.test.ts` is the last
`core_ext/array/extract_test.rb` test still reporting an assertion mismatch
after the Array/Integer convergence PR: `test_extract_without_block` is
`rails 5 vs trails 2` (count) and `instanceOf rails 1 vs trails 0` (kind).

The blocker is the impl, not the test. Rails
`activesupport/lib/active_support/core_ext/array/extract.rb:19-26`:

```ruby
def extract!
  return to_enum(:extract!) { size } unless block_given?
  extracted_elements = []
  reject! do |element|
    extracted_elements << element if yield(element)
  end
  extracted_elements
end
```

`extractBang` (`packages/activesupport/src/array-utils.ts:175-184`) has no
`to_enum` arm — with no predicate it splices the whole array and returns it.
So the Rails test's

```ruby
assert_instance_of Enumerator, extract_enumerator
assert_equal numbers.size, extract_enumerator.size
odd_numbers = extract_enumerator.each(&:odd?)
```

has nothing to assert against. There are no production callers of the
no-predicate form, so the arm can be added without touching call sites; decide
whether a JS analogue of a sized `Enumerator` is worth porting here or whether
this is a `@missingRailsCall`-style documented Ruby-only protocol.

## Acceptance criteria

- `core_ext/array/extract_test.rb` reports 0 assertion-count / -kind / -value
  mismatches in `pnpm parity:test -- --assertions --package activesupport`, or
  the divergence is documented at the call site with the Rails `file:line` and
  the reason the Enumerator protocol cannot be mirrored.
- `scripts/test-compare/assertion-mismatch-mark.json` lowered, never raised.
- No test name changes.
