---
title: "test_memsize asserts ObjectSpace.memsize_of and permanently caps the date population"
status: done
updated: 2026-08-10
rfc: "0088-date-gem-port"
cluster: null
packages: ["date"]
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6308
claim: "2026-08-09T23:26:04Z"
assignee: "exclude-test-memsize-from-the-date-test-population"
blocked-by: null
closed-reason: null
---

## Context

`vendor/date/test/date/test_date_new.rb:324-332` is `def test_memsize`, which
calls `ObjectSpace.memsize_of` to assert the C struct's allocated size:

```ruby
def test_memsize
  require 'objspace'
  t = Date.new
  ...
  assert_operator ObjectSpace.memsize_of(t), :>, size
end
```

It is in `parity:test`'s credited population for `date` (part of
`test_date_new.rb`'s 19 tests, inside the package's 138 total, measured
2026-08-09 at `0/138`), so it can never be credited and permanently caps the
package below 100%.

This is the same class as the exclusions RFC 0088 already landed at enrollment in
`scripts/parity/unported-files.ts` — `test_date_ractor.rb` (Ruby's actor
parallelism, "same grounds as `promise.rb`") and `test_date_marshal.rb` plus
`test_switch_hitter.rb`'s four `marshal*` per-test entries (Ruby's Marshal wire
format). `ObjectSpace` is Ruby's heap-introspection API; JS has no analogue and
the assertion is about the C struct layout the port does not have.

Note the per-test entry naming trap recorded in the RFC: `extract-ruby-tests.rb`
strips the `def test_` prefix, so the entry must be named `memsize`, **not**
`test_memsize` — a `test_`-prefixed entry is a silent no-op.

## Acceptance criteria

- [ ] A per-test `UNPORTED_FILES` entry named `memsize` for
      `test/date/test_date_new.rb` in `scripts/parity/unported-files.ts`, with the
      `ObjectSpace`/no-JS-analogue reason stated at the entry (matching the style of
      the existing `ractor` / `marshal*` entries).
- [ ] The entry is named `memsize`, not `test_memsize`, and a run of
      `pnpm parity:test` shows the `date` population drop from 138 to 137 —
      proving the entry is not a no-op.
- [ ] `scripts/parity/unported-overmatch.test.ts` (or its current equivalent)
      stays green.
- [ ] No other test is excluded in the same PR.
