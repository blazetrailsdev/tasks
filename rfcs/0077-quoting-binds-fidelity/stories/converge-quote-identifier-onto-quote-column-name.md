---
title: "converge-quote-identifier-onto-quote-column-name"
status: draft
updated: 2026-07-30
rfc: "0077-quoting-binds-fidelity"
cluster: null
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

## Context

`Quoting.quoteIdentifier` (`connection-adapters/abstract/quoting.ts`) is a
trails invention: Rails' `ActiveRecord::ConnectionAdapters::Quoting`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/quoting.rb`)
has no `quote_identifier`. Every adapter implements it as a pure synonym of
`quoteColumnName`, and ~123 non-test call sites use it.

Surfaced by the RFC 0080 audit of `moved` interface declaration names
(`audit-moved-interface-declaration-names`, PR 5675), which moved the `Quoting`
interface into its Rails-layout file. That move made 15 of its 16 members
Rails-allowed; `quoteIdentifier` is the only one left, tagged
`@noRailsEquivalent CONVERGEABLE (story: <this story>)`.

## Acceptance criteria

- Call sites are rewritten to `quoteColumnName`, the name Rails uses.
- `quoteIdentifier` is removed from the `Quoting` interface and from every
  adapter that implements it, along with the `@noRailsEquivalent` tag.
- `pnpm api:extra` exits 0 (no stale tag) and
  `connection-adapters/abstract/quoting.ts` reports no extra from this name.
