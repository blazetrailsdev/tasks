---
title: "activemodel: secure-password.test.ts holds 14 trails-only cases in a Rails-mapped file"
status: ready
updated: 2026-09-21
rfc: "0132-ar-closure-assertion-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 270
priority: 7
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activemodel/src/secure-password.test.ts` mirrors
`vendor/rails/activemodel/test/cases/secure_password_test.rb`, which
trails#7901 converged to 41/41 matched tests and 0 assertion mismatches. The
file still carries **14 trails-only cases** that Rails has no counterpart for —
`parity:test` reports them as the `Extra` column on that row — plus the
`createUserClass()` factory that exists only to serve them.

Same shape as `time-zone-converter-test-holds-eleven-trails-only-cases`
(this RFC, trails#7577): trails-only cases belong in the `.trails.test.ts`
sibling, which already exists at
`packages/activemodel/src/secure-password.trails.test.ts`.

The cases are the block beginning `constructor mass-assignment hashes password
and removes plaintext` through `password_salt returns null when no digest`.
Several of them predate the canonical `User` test model
(`packages/activemodel/src/test-helpers/models/user.ts`, mirroring
`vendor/rails/activemodel/test/models/user.rb`) and rebuild an ad-hoc model
instead; they should use `User` once relocated, which is what lets
`createUserClass()` and the `Model` / `Attributes` / `Dirty` / `include`
imports leave the Rails-mapped file entirely.

Left out of trails#7901 only because the move is ~270 LOC of churn (delete
here, add there) on top of a PR already at 576 LOC against a 700 ceiling. It is
not a regression from that PR — the cases were there before it.

## Acceptance criteria

- [ ] `secure-password.test.ts` contains only tests mirroring
      `secure_password_test.rb`; `parity:test`'s `Extra` count for that row is 0.
- [ ] The relocated cases live in `secure-password.trails.test.ts` and use the
      `User` / `Visitor` / `Pilot` test models rather than rebuilding models.
- [ ] `createUserClass()` is gone.
- [ ] `secure_password_test.rb` stays at 41/41 with 0 assertion mismatches; no
      test renamed.
