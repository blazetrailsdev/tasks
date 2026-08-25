---
title: "Drop encryption's EncodingError import alias for Errors::Encoding"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: 6108
claim: "2026-08-05T00:59:03Z"
assignee: "i18n-date-valid-date-frags-weeknum-blocks"
blocked-by: null
closed-reason: null
---

## Context

`converge-encryption-errors-onto-rails-class-names` (#6102) deleted encryption's
`ConfigError` / `EncryptionError` / `DecryptionError` aliases so `errors.ts`
defines exactly Rails' seven classes
(vendor/rails/activerecord/lib/active_record/encryption/errors.rb:6-13). One
non-Rails spelling of the same family survived, as an import alias rather than a
class:

- `packages/activerecord/src/encryption/encrypted-attribute-type.ts:8` —
  `import { Encoding as EncodingError }`, raised at `:337`
- `packages/activerecord/src/encryption/encryptable-record-message-pack-serialized.test.ts:13`
  — same alias, narrowed on at `:54`

Rails names the class `Errors::Encoding` and raises it as such
(errors.rb:7). The alias is out of scope for the errors story only because that
story enumerated the three CLASS aliases; this is the same deviation wearing an
`import as`, and it reads at the raise site as a class Rails does not define.

## Converged shape

Drop the alias in both files and name `Encoding` directly. Nothing else changes
— `Base#constructor` already sets `name` from `this.constructor.name`, so the
error's `name` is already `"Encoding"`; only the source spelling is wrong.

Check for the same shape elsewhere while you are there: `import { X as XError }`
over `encryption/errors.js` is the pattern to grep for.

## Acceptance criteria

- [ ] No `EncodingError` spelling remains under `packages/activerecord/src`.
- [ ] No `import { <RailsName> as <TrailsName> }` over `encryption/errors.js`
      remains.
- [ ] Encryption suites green on all three lanes.
