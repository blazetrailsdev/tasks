---
title: "adapter-prevent-writes-encoding-should-gate"
status: done
updated: 2026-06-25
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4091
claim: "2026-06-25T00:22:37Z"
assignee: "adapter-prevent-writes-encoding-should-gate"
blocked-by: null
---

## Context

`adapter_prevent_writes_test.rb` defines two same-named methods in an
if/else (`adapter_prevent_writes_test.rb:55` PostgreSQL variant vs `:66`
non-PG variant):

```ruby
if current_adapter?(:PostgreSQLAdapter)
  def test_doesnt_error_when_a_select_query_has_encoding_errors
    ActiveRecord::Base.while_preventing_writes do
      assert_raises ActiveRecord::StatementInvalid do
        @connection.select_all("SELECT '\xC8'")
      end
    end
  end
else
  def test_doesnt_error_when_a_select_query_has_encoding_errors
    ActiveRecord::Base.while_preventing_writes do
      assert_nothing_raised { @connection.select_all("SELECT '\xC8'") }
    end
  end
end
```

The Ruby extractor renders the PG variant gate as `adapters=[postgresql]`.
Our TS file `packages/activerecord/src/adapter-prevent-writes.test.ts`
carries the non-PG variant as an unconditional `it(...)` (correct) and the
PG variant as `it.skip(...)` (a TODO, no gate) — so
`pnpm test:compare --package activerecord --gates` reports a **should-gate**
mismatch: Rails gates it to PostgreSQL, we skip it as unimplemented.

The whole file currently uses `BetterSQLite3Adapter(":memory:")` in its
`beforeEach`, so the PG variant needs its own live `PostgreSQLAdapter`
(`PG_TEST_URL`) constructed inside a PG-gated test — PostgreSQL eagerly
fails on encoding errors at the client, so the read under
`withPreventedWrites` should raise `StatementInvalid`.

This is the last residual from `gate-residual-mismatch-burndown`; it was
left out of that PR because it requires a live-PG body that could not be
verified locally (no `PG_TEST_URL` in the dev environment).

## Acceptance criteria

- [ ] Replace the `it.skip("doesnt error when a select query has encoding
errors")` in `adapter-prevent-writes.test.ts` with a real
      PostgreSQL-gated test: `it.skipIf(adapterType !== "postgres")(...)`,
      body constructs a `PostgreSQLAdapter(PG_TEST_URL)`, runs
      `SELECT '\xC8'` under `withPreventedWrites`, and asserts it throws
      `StatementInvalid`. Do NOT rename the test.
- [ ] `pnpm test:compare --package activerecord --gates` no longer reports
      the `[should-gate] "doesnt error when a select query has encoding
errors"` mismatch (gate becomes `adapters=[postgresql]`, matching
      Rails).
- [ ] Verify on the PostgreSQL CI lane (the body cannot run on sqlite).
