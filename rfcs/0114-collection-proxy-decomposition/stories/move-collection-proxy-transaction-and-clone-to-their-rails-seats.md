---
title: "move-collection-proxy-transaction-and-clone-to-their-rails-seats"
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

# Move `CollectionProxy#transaction` and `#clone` to their Rails seats

## Context

Surfaced by RFC 0114's 2026-08-21 re-measurement (`## The re-measurement`).
Bucket H's two remaining non-finder overrides:

- `collection-proxy.ts:1320-1329` defines `transaction(fn, options)`, 10 code
  lines that reach for `this.model.transaction`. `collection_proxy.rb` defines
  no `transaction` at all; the Rails seat is
  `CollectionAssociation#transaction` (`collection_association.rb:212-214`),
  which is `reflection.klass.transaction(&block)`. `parity:api:extra` reports
  the name as moved to exactly that file.
- `collection-proxy.ts:1391-1402` overrides `clone()`, 12 code lines that build
  an `AssociationRelation` and `initializeCopy` onto it. Rails' proxy has no
  `clone`; `parity:api:extra` resolves the name to
  `arel nodes/binary.rb Arel::Nodes::Binary#initialize_copy`. Since
  `collection-proxy-initialize-is-five-lines` (#6745) stopped the proxy from
  carrying seeded Relation state, the reason this override existed — there was
  local state to copy — is gone.

Both are the F3/F5 tail: overrides that only looked reasonable while the proxy
held its own relation state.

## Acceptance criteria

- [ ] `transaction` delegates to the association (`CollectionAssociation#transaction`)
      or is removed from the proxy so the inherited path answers, citing
      `collection_association.rb:212-214`.
- [ ] `clone` is removed unless a test pins proxy-specific clone behaviour; if
      one does, cite it and converge the body onto `initializeCopy` alone.
- [ ] `pnpm parity:api:extra --package activerecord` no longer lists
      `transaction` or `clone` as moved names for this file.
- [ ] Zero rows for `associations/collection-proxy.ts` in both call gates.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
