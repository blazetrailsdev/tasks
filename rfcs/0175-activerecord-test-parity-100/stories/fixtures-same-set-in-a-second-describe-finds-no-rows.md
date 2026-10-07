---
title: "activerecord: fixtures() naming one set in a second describe finds no rows (RecordNotFound in the fixture-cache loop)"
status: draft
updated: 2026-10-07
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Seen while working trails PR 8656 (`activerecord-converge-test-infra-convergeable-receipts`), not investigated.

In `packages/activerecord/src/test-fixtures.test.ts`, a second `describe` that calls
`fixtures(["encryptedBooks"])` after the existing `encryptedBooks set` describe (inside
`useFixtures bootstraps the encryption add-on for encrypted fixtures`, so encryption is configured) fails in
its `beforeEach` on SQLite:

```text
ActiveRecord::RecordNotFound: Couldn't find EncryptedBook with [WHERE "encrypted_books"."id" = ?]
  EncryptedBook.findByBang  core.ts:1044
  Fixture.find              fixtures.ts:431
  test-fixtures.ts (the fixture-cache loop in registerFixtureHooks' beforeEach)
```

The same happened with the describe placed at file top level. PR 8656 worked around it by putting its
assertion inside the existing describe.

Rails loads a fixture set once per connection pool and answers later requests from the cache
(`vendor/rails/v8.0.2/activerecord/lib/active_record/fixtures.rb:595-613`, `create_fixtures`:
`fixture_is_cached?` rejects the set from `fixture_files_to_read`, `cached_fixtures` returns it), and the
rows stay in the table because they were inserted outside the per-test transaction
(`vendor/rails/v8.0.2/activerecord/lib/active_record/test_fixtures.rb`, `setup_fixtures` /
`load_fixtures`). So a second test class naming the same set finds its rows.

Not established: whether this is specific to the encrypted sets (the `addOn` hook, deterministic
encryption of the lookup), to a set being cached while its rows were rolled back or deleted, or to sibling
describes sharing one test-case class chain. `deadParrots` / `liveParrots` are each loaded in one describe
only, so that file does not show whether a plain set repeats cleanly.

## Acceptance criteria

- [ ] A `.trails.test.ts` case loads one fixture set through `fixtures()` in two sibling describes of one file and reads a row in both; it fails on the baseline for the encrypted set (and the story records whether a plain set fails too).
- [ ] The cause is identified against `fixtures.rb:595-613` and fixed so the second describe finds its rows, as a second Rails test class does.
- [ ] If the cause turns out to be intended trails behaviour with a Rails counterpart, the story is closed with that Rails `file:line`, not left open.

## Verification

```bash
pnpm vitest run packages/activerecord/src/test-fixtures.test.ts
```
