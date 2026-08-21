---
title: "retire-collection-proxy-append-bang-and-wire-inverse-target"
status: ready
updated: 2026-08-21
rfc: "0114-collection-proxy-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

# Retire `CollectionProxy#appendBang` and `_wireInverseTarget`

## Context

Surfaced by RFC 0114's 2026-08-21 re-measurement (`## The re-measurement`).
Bucket E's surviving re-implementations, after the F1 stories landed, are
`appendBang` (`collection-proxy.ts:1290`, 17 code lines) and
`_wireInverseTarget` (`:680`, 6).

`appendBang` has no Rails counterpart on `CollectionProxy` — `collection_proxy.rb`
has `<<` with `push`/`append`/`concat` aliases (`:1049-1054`) and nothing bang.
`pnpm parity:api:extra --package activerecord` resolves the name to
`actionview flows.rb ActionView::OutputFlow#append!`, i.e. it is a moved name,
not a mirror. Its raise-on-invalid semantics belong to
`CollectionAssociation#concat` → `insert_record(record, true)`
(`collection_association.rb:118-131`), whose `raise` argument is exactly this
distinction.

`_wireInverseTarget` duplicates `Association#set_inverse_instance`
(`association.rb:203-208`), which `add_to_target` already calls.

## Acceptance criteria

- [ ] `appendBang`'s callers route through the association's own bang path
      (`insert_record(record, true)`), or the method is deleted outright if
      nothing in-repo needs it; cite the Rails seat either way.
- [ ] `_wireInverseTarget` is deleted in favour of `setInverseInstance`.
- [ ] `pnpm parity:api:extra --package activerecord` shows the file at fewer
      moved names than the 7 measured on 2026-08-21.
- [ ] Zero rows for `associations/collection-proxy.ts` in both call gates.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
