---
title: "gem-ports-score-as-extra-surface"
status: draft
updated: 2026-09-10
rfc: "0094-sqlite3-adapter-construction-fidelity"
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

## Context

`packages/activerecord/src/sqlite/pragmas.ts` is a port of the ruby-sqlite3
gem's `SQLite3::Pragmas` module (`sqlite3/lib/sqlite3/pragmas.rb`), which Rails
calls into from `SQLite3Adapter#configure_connection`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:838-844`:
`::SQLite3::Pragmas.method_defined?("#{pragma}=")` then
`@raw_connection.public_send("#{pragma}=", value)`).

The api-compare extra-surface population only knows Rails files, so it scores
this file as "no Rails counterpart" and every exported name in it as novel
extra surface — even though each one has an exact, citable counterpart in the
gem. Landed in PR #7656, this forces two shapes that are otherwise unwanted:

- `setPragma` carries a `@noRailsEquivalent` receipt. Removing it takes the
  gate to `novel 172/170`.
- `SQLite3Exception` (the port of `sqlite3/lib/sqlite3/errors.rb:4`) has to stay
  module-private, so callers cannot catch it by class. Exporting it takes
  `total` to `600/599`, and a receipt does not exempt `total`.

The same question will recur for any other gem trails ports as a driver-layer
dependency of a Rails call site.

## Acceptance criteria

- The extractor can attribute a trails file to a non-Rails Ruby source (the
  gem), so names with a gem counterpart are scored as matched rather than as
  novel/extra surface — or a reviewed decision is recorded that gem ports are
  deliberately out of the compared population and receipts are their permanent
  shape.
- If the former: `setPragma`'s `@noRailsEquivalent` receipt in
  `packages/activerecord/src/sqlite/pragmas.ts` is deleted, and the marks are
  tightened with `pnpm parity:api:extra:tighten`.
- `SQLite3Exception` is exported so a caller can catch the gem's counterpart
  class, as callers of ruby-sqlite3 can.
