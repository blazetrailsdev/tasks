---
title: '"validate column sizes" gates on an adapter name where Rails gates on the column limit'
status: ready
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: 44
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #7291, which taught the parity:test gate extractor to read
`currentAdapter(...)`. That immediately exposed this case as `over-gated` —
it had been invisible only because the extractor could not read the idiom.

Rails gates "validate column sizes" on a RUNTIME column limit, not on an
adapter name
(`vendor/rails/activerecord/test/cases/encryption/encryptable_record_test.rb:299-308`):

```ruby
# Only run for adapters that add a default string limit when not provided (MySQL, 255)
if author_name_limit = EncryptedAuthor.columns_hash["name"].limit
  # No column limits in SQLite
  test "validate column sizes" do
    assert_predicate EncryptedAuthor.new(name: "jorge"), :valid?
    assert_not EncryptedAuthor.new(name: "a" * (author_name_limit + 1)).valid?
    author = EncryptedAuthor.create(name: "a" * (author_name_limit + 1))
    assert_not author.valid?
  end
end
```

`packages/activerecord/src/encryption/encryptable-record.test.ts` gates it on
an adapter-name proxy instead:

```ts
const authorNameLimitPresent = currentAdapter("Mysql2Adapter", "TrilogyAdapter");

it.skipIf(!authorNameLimitPresent)("validate column sizes", async () => {
```

The proxy is a trails invention: it hard-codes "MySQL is the adapter that adds
a default string limit" where Rails asks the schema. It also drifts silently if
another lane ever grows a default limit, and it forces the test body to re-read
the real limit from `columnsHash()` after the gate has already guessed.

The Ruby extractor reads the Rails side as unconditional (the `if` is class-body
control flow, not a `current_adapter?` gate), so any adapter claim on our side
is a gate-mismatch — which is why PR #7291 had to spell the gate as an
unrecognised expression to keep the hard-zero check green. That spelling keeps
CI honest but does not converge the deviation.

## Converged shape

Gate on the column limit itself, as Rails does. The obstacle is that trails'
schema load is async while `skipIf` / `runIf` are evaluated at collection time,
so the limit is not knowable when the gate is built. Options, in preference
order:

1. Resolve the limit during collection via the suite's existing collection-time
   schema access, so the gate reads `EncryptedAuthor.columnsHash()["name"].limit`
   like Rails.
2. Keep the test ungated and let the body read the limit, mirroring Rails'
   `if` by skipping at runtime — blocked today by
   `blazetrails/no-freeform-comments` and `vitest/no-conditional-in-test`
   firing on that shape, so it needs a decision on whether a runtime gate is a
   sanctioned idiom in ported tests.

Whichever lands, the adapter-name proxy goes away and the gate stops encoding
an adapter list Rails never wrote.

## Acceptance criteria

- [ ] The gate derives from the `name` column's limit, not from
      `currentAdapter(...)`.
- [ ] `parity:test` gate-mismatch stays at 0 repo-wide.
- [ ] The test still runs on MySQL and is skipped on PostgreSQL and SQLite.
