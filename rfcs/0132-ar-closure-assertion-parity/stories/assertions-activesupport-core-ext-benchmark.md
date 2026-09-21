---
title: "Port core_ext/benchmark_test.rb and the Benchmark.ms core-ext it covers"
status: ready
updated: 2026-09-21
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: 5
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging the `benchmark` tail in trails#7916.
`packages/activesupport/src/core-ext/benchmark.test.ts` is a four-line stub —
`it.skip("is deprecated")` with no body — so `parity:test --assertions` reports
`core_ext/benchmark_test.rb` at 0/1/0 (one assertion-kind mismatch) and the
test is unported.

Rails (`vendor/rails/activesupport/test/core_ext/benchmark_test.rb:6-11`):

```ruby
class BenchmarkTest < ActiveSupport::TestCase
  def test_is_deprecated
    assert_deprecated(ActiveSupport.deprecator) do
      assert_kind_of Numeric, Benchmark.ms { }
    end
  end
end
```

Two assertions: `assert_deprecated` (unmapped both sides) and
`assert_kind_of` → `instanceOf`.

The converged shape is

```ts
await assertDeprecated(ActiveSupport.deprecator(), null, () => {
  expect(Benchmark.ms(() => {})).toBeInstanceOf(Number);
});
```

which needs the `Benchmark.ms` core-ext
(`vendor/rails/activesupport/lib/active_support/core_ext/benchmark.rb:5-11`,
deprecated through `ActiveSupport.deprecator`) to exist in
`packages/activesupport/src/core-ext/benchmark.ts` — today only
`packages/activesupport/src/benchmark.ts` (`ActiveSupport::Benchmark#realtime`)
is ported.

## Acceptance criteria

- [ ] `Benchmark.ms` is ported to
      `packages/activesupport/src/core-ext/benchmark.ts`, mirroring
      `core_ext/benchmark.rb`, and warns through `ActiveSupport.deprecator`.
- [ ] `core-ext/benchmark.test.ts` ports `test_is_deprecated` with the
      converged body above; the `it.skip` stub is gone.
- [ ] `pnpm parity:test -- --package activesupport --assertions` reports
      `core_ext/benchmark_test.rb` at 0 count, 0 kind, 0 value.
