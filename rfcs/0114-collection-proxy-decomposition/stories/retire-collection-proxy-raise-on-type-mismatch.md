---
title: "retire-collection-proxy-raise-on-type-mismatch"
status: done
updated: 2026-08-21
rfc: "0114-collection-proxy-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6821
claim: "2026-08-21T14:20:44Z"
assignee: "retire-collection-proxy-raise-on-type-mismatch"
blocked-by: null
closed-reason: null
---

# Retire `CollectionProxy#_raiseOnTypeMismatch`

## Context

Surfaced by RFC 0114's 2026-08-21 re-measurement (`## The re-measurement`).

`packages/activerecord/src/associations/collection-proxy.ts:790-812`
(`_raiseOnTypeMismatch`, 15 code lines) re-resolves the association class from
`options.className ?? camelize(singularize(name))` and raises
`AssociationTypeMismatch` itself. It is the second copy of
`Association#raise_on_type_mismatch!`
(`vendor/rails/activerecord/lib/active_record/associations/association.rb:257-263`),
which trails already ports.

Rails' `CollectionProxy#<<` is one line —
`proxy_association.concat(records) && self` (`collection_proxy.rb:1049-1051`) —
and does **no** type checking at the proxy at all. The check happens once, on
`CollectionAssociation#add_to_target` → `callback(:before_add, record)` /
`raise_on_type_mismatch!` (`collection_association.rb:311-333`), which the
`concat` the proxy delegates to already reaches.

The proxy copy also diverges: it derives the class from the association _name_
rather than from `reflection.klass`, so a `class_name:` reflection resolved
through namespace-relative `compute_class` can disagree with the association's
own answer.

## Acceptance criteria

- [ ] `_raiseOnTypeMismatch` is deleted; `push` no longer calls it.
- [ ] The type-mismatch behaviour is proven still correct by the existing
      `AssociationTypeMismatch` tests (cite them) — no test is renamed.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` stay green with
      **zero** rows for `associations/collection-proxy.ts` (RFC 0114's standing
      constraint).
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
