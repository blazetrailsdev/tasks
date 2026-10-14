---
title: "activerecord: sqlite3 adapter test's binary-column and encoding tests take Rails' bodies"
status: in-progress
updated: 2026-10-14
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#8885
claim: "2026-10-14T02:12:30Z"
assignee: "sqlite3-adapter-test-binary-and-encoding-tests-take-rails-bodies"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converting `packages/activerecord/src/adapters/sqlite3/sqlite3-adapter.test.ts`
to Rails' `with_example_table` blocks (`sqlite3-adapter-test-with-example-table-blocks-part-2`).
Two tests in that file keep an invented body over an invented table. The blanket `afterEach`
drop list that used to clean them up is gone, and they now rely on the per-test `:memory:` pool
being discarded.

- `quote binary column escapes it` creates a `bin_esc` table and round-trips a `BinaryData`
  through `execInsert`. Rails
  (`vendor/rails/v8.0.2/activerecord/test/cases/adapters/sqlite3/sqlite3_adapter_test.rb:466-480`)
  creates `dual_encodings` on `DualEncoding.lease_connection`, saves
  `DualEncoding.new name: "いただきます！", data: str` with `str` an ASCII-8BIT `"\x80"`, asserts
  `str == binary.data`, and drops the table in `ensure`. `DualEncoding` is declared at
  `sqlite3_adapter_test.rb:13-14`.
- `type cast should not mutate encoding` creates an `enc_test` table and inserts a `BinaryData`
  copy. Rails (`sqlite3_adapter_test.rb:482-488`) is `Owner.create(name: name)` for an
  ASCII-8BIT `name`, asserts `name.encoding` is unchanged, and runs `Owner.delete_all` in
  `ensure`. The `name.encoding` assertion is the String encoding tag CLAUDE.md, "A String has no
  encoding tag either" rules unportable, so the body that remains is the `create` and the
  `ensure`.

## Acceptance criteria

- [ ] `quote binary column escapes it` has Rails' body over a `DualEncoding` model and the
      `dual_encodings` table, dropped in a `finally`.
- [ ] `type cast should not mutate encoding` has Rails' `Owner.create` / `Owner.delete_all`
      body, with the encoding assertion dropped under an assertion receipt citing the CLAUDE.md
      section.
- [ ] Neither test creates `bin_esc` or `enc_test`. Test names unchanged.
