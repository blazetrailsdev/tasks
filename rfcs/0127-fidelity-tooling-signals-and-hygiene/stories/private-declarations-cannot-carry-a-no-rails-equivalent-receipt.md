---
title: "A private declaration with no Rails counterpart cannot carry a receipt"
status: draft
updated: 2026-08-29
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced on #7189. That PR added two private methods with no Rails counterpart —
`registerSqlTypeName` (`packages/activerecord/src/connection-adapters/postgresql/oid/type-map-initializer.ts`)
and `nativeTypeNamesQuery` (`connection-adapters/postgresql-adapter.ts`) — the
engineered substitute for Rails' live
`SELECT '<sql_type>'::regtype::oid` in `PostgreSQL::Quoting#lookup_cast_type`
(`activerecord/lib/active_record/connection_adapters/postgresql/quoting.rb:194-197`).

CLAUDE.md requires every deviation to be justified **at the call site**. There
is currently no way to do that for a private member:

- A `@noRailsEquivalent PERMANENT` on `registerSqlTypeName` is scored STALE by
  the extra-surface gate, which reports
  `1 STALE @noRailsEquivalent tag(s) on methods that no longer flag as extra
surface — ... the declaration is internal or _-prefixed (never counted)` and
  instructs "Delete the tag next to the code". A private declaration is never
  counted as extra surface, so the receipt is stale by construction.
- `blazetrails/no-freeform-comments` removes any prose alternative, by design
  (`eslint/no-freeform-comments.mjs` header, maintainer policy 2026-08-27) —
  including a `— PERMANENT: <reason>` clause on a receipt, which it trims back
  to the bare tag.

So invented **private** machinery ships with no call-site marker at all and is
invisible to every register. The rationale for #7189's two methods lives only in
the PR body. This is the private-member analogue of the uncoverable-member class RFC 0121
tracked (`extra-surface-inherited-interface-members-are-uncoverable`); 0121 is
closed, so it lands here.

## Converged shape

Give a private declaration a receipt the extractor accepts, so the
justify-at-the-call-site rule is satisfiable for it. Either:

- score a `@noRailsEquivalent` on a private/`_`-prefixed declaration as
  `Allowed` rather than STALE (the `unbacked-internal-needs-receipt` precedent
  in RFC 0121, where a receipt re-enters the member into the measured surface), or
- add a distinct private-only receipt tag that the stale-tag gate recognises.

Whichever is chosen, `registerSqlTypeName` and `nativeTypeNamesQuery` should
then carry it.

## Acceptance criteria

- [ ] A private declaration with no Rails counterpart can carry a receipt that
      the extra-surface stale-tag gate accepts.
- [ ] `registerSqlTypeName` and `nativeTypeNamesQuery` carry that receipt.
- [ ] `pnpm parity:api:extra --package activerecord` reports no STALE tag.
- [ ] Test coverage for the new disposition in the extractor's own suite.
