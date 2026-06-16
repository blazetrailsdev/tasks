---
title: "assoc-has-one-writer-persist"
status: ready
updated: 2026-06-16
rfc: "0019-canonical-schema-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

While converting `has-one-associations.test.ts` to canonical Pirate/Ship models
(story assoc-has-one, RFC 0019), three real has_one writer/persist gaps surfaced
that block faithful porting of the assignment/replacement tests. Two skipped
tests in `HasOneAssociationsCanonicalTest` document them:

- `associations/has-one-association.ts` `persistReplace` →
  `removeTargetBang(this, dependent ?? "")`: for a plain replacement (no
  `dependent`), Rails' `HasOneAssociation#remove_target!` nullifies the old
  record's FK in its `else` branch, but trails' `removeTargetBang` only
  nullifies on the literal `"nullify"` method and no-ops otherwise.
- `build` schedules a `_pendingReplace` with `previousTarget: null`; a later
  `writer(newRecord)` updates `.record` but leaves `previousTarget` null, so
  `persistReplace` never nullifies the previously-associated (built-then-saved)
  record. (See "has one assignment triggers save on change on replacing
  object".)
- The canonical `Account` model's `check_empty_credit_limit` validation reads
  `this.creditLimit` (camelCase) but the generated accessor is snake-case
  `credit_limit`, so a built Account is always "credit limit can't be blank"
  and never persists through the has_one writer. (See "nullification on
  association change" / "natural assignment to nil".)

Already fixed in the assoc-has-one wave-1 PR: `replace` called the
`hasChangesToSave` _getter_ as a function (`?.hasChangesToSave?.()`), crashing
same-record has_one reassignment — corrected to `?.hasChangesToSave`.

## Acceptance criteria

- [ ] `removeTargetBang` nullifies the old record's FK by default (mirroring
      `remove_target!`'s `else` branch), and `_pendingReplace.previousTarget`
      tracks the currently-persisted target through build→save→writer.
- [ ] Canonical `Account` validation reads the real `credit_limit` attribute.
- [ ] Un-skip the two `HasOneAssociationsCanonicalTest` writer tests and the
      `natural assignment to nil` / `nullification on association change` ports.
