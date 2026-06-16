---
title: "assoc-has-one-writer-persist"
status: draft
updated: 2026-06-16
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

While converting `has-one-associations.test.ts` to canonical models (story
assoc-has-one, RFC 0019), several has_one writer/persist gaps surfaced.

**Already fixed in the assoc-has-one wave-1 PR (#3466)** — context only:

- `replace` called the `hasChangesToSave` _getter_ as a function
  (`?.hasChangesToSave?.()`), crashing same-record has_one reassignment.
- `removeTargetBang` only nullified on the literal `"nullify"` method; now
  nullifies the displaced record's FK by default + clears the inverse + raises
  `RecordNotSaved` on save failure, mirroring `HasOneAssociation#remove_target!`.
- `build` scheduled a `_pendingReplace` with `previousTarget: null`; `replace`
  now promotes a built-then-saved displaced record to `previousTarget`.

**Still open:** the canonical `Account` model's `check_empty_credit_limit`
validation reads `this.creditLimit` (camelCase) but the generated accessor is
snake-case `credit_limit`, so a built Account is always "credit limit can't be
blank" and never persists through the has_one writer. This blocks the faithful
ports of `natural assignment to nil` and `nullification on association change`
(which build/assign canonical Accounts), which therefore remain bespoke in
`has-one-associations.test.ts` pending convergence.

## Acceptance criteria

- [ ] Canonical `Account` validation reads the real `credit_limit` attribute
      (parity-check the Rails `Account` model first).
- [ ] Port `natural assignment to nil` and `nullification on association change`
      onto canonical Firm/Account + fixtures (part of the broader assoc-has-one
      `firms`/`accounts`/`companies` convergence wave).
