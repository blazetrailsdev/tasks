---
title: "preserve-original-encrypted-skips-its-column-check-on-a-cold-schema-cache"
status: blocked
updated: 2026-10-09
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-10-09T22:09:41Z"
assignee: "preserve-original-encrypted-skips-its-column-check-on-a-cold-schema-cache"
blocked-by: "owner decision: the acceptance criteria are jointly unsatisfiable as written. A class-body encrypts runs on a cold schema cache where columnNames() answers [] (activerecord CLAUDE.md, Schema reflection peeks at a warm cache), so the bare Rails guard raises for the canonical EncryptedBookThatIgnoresCase at import (criterion 3). Raising for a cold declaration therefore needs the guard re-entered at schema load, which needs either remembered per-class state or a second raise site (both ruled out by criterion 2): preserveOriginalEncrypted cannot simply be re-run, since it re-declares encrypts(original_name) and includes a second accessor module. Owner to choose: (a) a pending queue drained by load_schema! beside encryptable_record.rb:126-130, (b) split guard from body, or (c) ratify the cold arm PERMANENT."
closed-reason: null
---

## Context

Left over from `encryption-preserve-original-column-check-waits-for-reflection` (trails PR 8719), which
removed the post-reflection re-check and its `_ignoreCasePreservedAttributes` bookkeeping.

Rails' `preserve_original_encrypted`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/encryption/encryptable_record.rb:99-107`) raises
`Errors::Configuration` at declaration when `column_names` lacks `original_<name>`; `column_names`
loads the schema in line.

`preserveOriginalEncrypted` (`packages/activerecord/src/encryption/encryptable-record.ts`) holds Rails'
guard verbatim, but inside an `if (columnNames.length !== 0)` Rails does not have: a class-body
`encrypts` runs before the schema cache is warm (packages/activerecord/CLAUDE.md § "Schema reflection
peeks at a warm cache"), where `columnNames()` answers `[]`, and the bare guard would raise for every
canonical model at import (`packages/activerecord/src/test-helpers/models/book-encrypted.ts`,
`EncryptedBookThatIgnoresCase`).

Consequence: a model that declares `ignoreCase` cold and has no `original_<name>` column is never
checked. It fails at its first write with the database's missing-column error instead of
`Errors::Configuration`.

The receipt on `preserveOriginalEncrypted` is `@inventedArm if — CONVERGEABLE <this story>`.

## Acceptance criteria

- [ ] `preserveOriginalEncrypted` runs Rails' guard with no enclosing `columnNames.length !== 0` test,
      and the `@inventedArm if` receipt is gone.
- [ ] A model declaring `encrypts(name, { ignoreCase: true })` without an `original_<name>` column
      raises `Errors::Configuration`, whether its schema was warm or cold at declaration, with a test
      for each; no per-class bookkeeping Set and no second raise site is reintroduced.
- [ ] The canonical `EncryptedBookThatIgnoresCase` still imports before its schema is loaded.
