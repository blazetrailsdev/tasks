---
title: "converge-encryption-makefreshmodel-to-rails-fixture-pattern"
status: claimed
updated: 2026-07-02
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-07-02T16:09:53Z"
assignee: "converge-encryption-makefreshmodel-to-rails-fixture-pattern"
blocked-by: null
closed-reason: null
---

## Context

Follow-up to `converge-encryption-makefreshmodel-onto-canonical` (PR #4408),
which moved the trails-only `makeFreshModel` helper off dynamic `fresh_model_N`
tables onto canonical tables. That closed the one-schema divergence but left two
Rails-fidelity gaps, because **Rails has no `makeFreshModel` helper at all.**

Verified against `activerecord/test/cases/encryption/encryptable_record_test.rb`
(rails/rails main):

- Rails gets a "fresh" encryptable class via an **anonymous subclass of an
  existing model on the canonical table**, e.g.
  `OtherEncryptedPost = Class.new(Post) { self.table_name = "posts"; encrypts :title }`
  (and the SHA1 tests: `Class.new(Post) { self.table_name = "posts"; encrypts :title, key_provider: ... }`).
- `encrypts normalized data` uses the **named fixture models**
  `EncryptedBookNormalizedFirst` / `EncryptedBookNormalizedSecond` on
  `encrypted_books`, asserting on **`name` AND `logo`** (logo is the canonical
  `binary` column).
- `encrypts serialized attributes` uses
  **`EncryptedTrafficLight.create!(state: states, long_state: states)`** on
  `traffic_lights` (state = serialized Array), NOT a `settings`-hash model.

PR #4408's CI-safe dodges that this story should converge:

- `encrypts normalized data`: Rails rides `EncryptedBookNormalizedFirst/Second`
  on `encrypted_books` with cols name + **logo (binary)**; #4408 uses
  `makeFreshModel` on `encrypted_books` with cols name + **original_name
  (string)**.
- `encrypts serialized attributes`: Rails rides `EncryptedTrafficLight` on
  `traffic_lights` (state Array); #4408 uses `makeFreshModel` on
  `to_be_linked_users.settings` (json).

## Blocking impl gap

The `logo` half of `encrypts normalized data` collides with the tracked
text-ciphertext-into-`binary`-column round-trip gap (see the already-skipped
`serialized binary data can be encrypted` in `encryptable-record.test.ts`): on
PG/MariaDB the driver returns the stored ciphertext as raw bytes and decryption
fails ("hash without payload"); SQLite is loose so it passes. Also, trails binary
attributes read back as `Uint8Array`, so `assertEncryptedAttribute(book, "logo",
"book")` (string) needs byte-aware comparison, unlike Ruby's ASCII-8BIT `==`.
Faithful `logo` convergence depends on that impl fix; until then the `logo`
assertion stays skipped/tracked-pending-convergence, matching its sibling.

## Acceptance criteria

- Replace `makeFreshModel` callsites with the Rails pattern: inline anonymous
  `Base` subclasses that set `_tableName` on the canonical table + declare
  attributes/`encrypts` (the TS analog of the `Class.new(Post)` block), OR the
  named fixture-model factories where Rails uses them. Retire `makeFreshModel`
  once no callsites remain.
- `encrypts normalized data` rides `EncryptedBookNormalizedFirst/Second` on
  `encrypted_books` (name + logo). Skip/track only the `logo` binary-round-trip
  assertion per the impl gap above; keep the `name` assertions live.
- `encrypts serialized attributes` rides `EncryptedTrafficLight` on
  `traffic_lights` (state serialized Array), matching Rails; drop the
  `to_be_linked_users` addition from `ENCRYPTION_CANONICAL_TABLES` if nothing
  else needs it.
- No test renames. All touched files pass on sqlite + CI PG/MySQL.
