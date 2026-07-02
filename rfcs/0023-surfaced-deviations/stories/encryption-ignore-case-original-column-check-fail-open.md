---
title: "ignore_case original_<name> missing-column check is fail-open when adapter absent at declaration (Rails fail-closed)"
status: in-progress
updated: 2026-07-02
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 4445
claim: "2026-07-02T22:09:52Z"
assignee: "encryption-ignore-case-original-column-check-fail-open"
blocked-by: null
closed-reason: null
---

## Context

`EncryptableRecord.preserveOriginalEncrypted` /
`requireOriginalColumnPresent`
(`packages/activerecord/src/encryption/encryptable-record.ts`) enforce the
`ignore_case` requirement that an `original_<name>` column exist (when
`supportUnencryptedData: false`) **only** when `columnNames()` returns a
non-empty list at declaration time.

When `Base.encrypts("name", { ignoreCase: true })` is declared at static-init
before the adapter is connected, `columnNames()` returns `[]` ("unknown", not
"absent"), so the check is deferred — and never re-run. A genuinely missing
`original_<name>` column is then silently accepted (fail-open) instead of
raising `Configuration`, as long as the adapter isn't connected at declaration.

Rails deviates: `preserve_original_encrypted`
(`encryptable_record.rb:101-103`) checks `column_names.include?(...)`, and
`column_names` forces a schema load, so Rails **always** has the full column
set at declaration and raises unconditionally (fail-closed).

This was surfaced during PR #4420
(`encrypt-route-primary-attribute-through-encrypt-attribute`). A first attempt
(a post-schema `revalidatePreservedColumns` re-check driven from
`applyPendingEncryptions`, gated on `_schemaLoaded`) was reverted because it
produced false positives during **incremental** `attribute()` declaration —
`encrypts` may run before `attribute("original_name")`, so `_attributeDefinitions`
is a partial view and the eager `columnNames()` call forces a partial load that
momentarily lacks the column. Main's merged design (PR #4418) accepts the
fail-open-when-adapter-absent behavior, which #4420 converged onto.

## Acceptance criteria

- [ ] `Base.encrypts(..., { ignoreCase: true })` on a model whose
      `original_<name>` column is genuinely absent (and
      `supportUnencryptedData: false`) raises `Configuration` **once the real
      adapter schema has been reflected**, even when the attribute was declared
      at static-init before the adapter was connected — matching Rails'
      fail-closed `preserve_original_encrypted`.
- [ ] No false positive during incremental static-init declaration where
      `encrypts(ignoreCase)` precedes `attribute("original_<name>")` (see the
      replay-safe test in `encryptable-record.test.ts`).
- [ ] Distinguish "schema reflected, column absent" from "declaration in
      progress" via a robust post-reflection hook (not the eager `columnNames()`
      partial-load path).
- [ ] Test both branches against a real canonical adapter (missing-column model
      on `authors`; present-column model on `encrypted_books`).
