---
title: "arel-suite-engine-is-fake-record-base"
status: ready
updated: 2026-07-22
rfc: "0007-remove-global-arel-visitor"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-up to #5036, which restored `Arel::Table.engine` and made `Node#toSql`
compile through it.

Rails' Arel suite installs a FakeRecord engine for **every** test
(`vendor/rails/activerecord/test/cases/arel/helper.rb:19-20`):

```ruby
@arel_engine = Arel::Table.engine
Arel::Table.engine = FakeRecord::Base.new
```

and `FakeRecord::Connection#initialize` builds its visitor against itself
(`fake_record.rb:36`):

```ruby
@visitor = Arel::Visitors::ToSql.new(self)
```

So every `.to_sql()` in Rails' arel suite compiles through the FakeRecord
quoting double — which is why its expected SQL embeds `'t'`/`'f'` for booleans,
a rendering no real adapter produces.

trails diverges: `packages/arel/src/test-setup-engine.ts` installs a generic
`new ToSql()` (connection-less default quoter) suite-wide. The FakeRecord
quoting double is already ported (`test-helpers/connection.ts`, #5037) and
exposed as `fakeRecordEngine` (#5036), but it is **opt-in** — used by exactly
one test — because flipping the suite default changes the expected SQL of every
boolean/quoting assertion at once.

This also keeps the suite anchored on `defaultQuoter`, the connection-less
quoter RFC 0007 is deleting.

## Acceptance criteria

- [ ] `test-setup-engine.ts` installs `fakeRecordEngine` (or a per-test
      equivalent of Rails' setup/teardown save-and-restore, `helper.rb:19-24`)
      rather than a generic `ToSql`.
- [ ] Assertions that were written against the generic quoter are reconciled
      with the FakeRecord rendering — matching the Rails counterpart's expected
      SQL verbatim, not weakened to fit.
- [ ] No arel test depends on `defaultQuoter` via the suite engine.
- [ ] api:compare / test:compare delta non-negative.
