---
title: "Attribute each moved extra to the Rails file/method it credits against"
status: done
updated: 2026-08-08
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 6234
claim: "2026-08-08T14:04:11Z"
assignee: "attribute-moved-extras-to-their-rails-owner"
blocked-by: null
closed-reason: null
---

## Context

`buildGlobalRubyCandidates` (`scripts/api-compare/extra-surface.ts:1003`)
flattens every camelized Ruby method, constant and declaration name in
Rails-land into ONE `Set<string>` with no file, class or package attached.
`moved` is then just `globalRubyCandidates.has(name)`
(`extra-surface.ts:1329`). The report can therefore say a name exists
somewhere in Rails, but never where — and "where" is the entire question a
`moved` verdict asks the reader to answer, because it is what separates a
misplaced port (rename owed) from a bare-short-name collision (nothing owed).

Resolving `sqlite/libsql.ts` (PR #6229) had to answer that question for five
names and there was no way to do it from the tool: it took a throwaway script
re-walking `output/rails-api.json` and re-deriving the camelization by hand to
find that `close` credits against `Rack::BodyProxy#close`, `prepare` against
`ActiveRecord::Store::HashAccessor#prepare`, `isOpen` against
`Transaction#open?` (`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/transaction.rb:113,177`),
`open` against `SchemaCache#open` / `MigrationContext#open`, and
`databaseExists` against `AbstractAdapter#database_exists?`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb`).
That script is gone; the next agent to hit a `moved` rejection rewrites it.

The same gap makes the `postgresql/schema-statements-class.ts` counterexample
(~80 moved names of a genuinely renamed port) and the libsql case textually
indistinguishable in the report — both read as "N moved name(s): a, b, c" —
even though one is a rename owed and the other is noise. With owners attached
they separate on sight: ~80 names all crediting `PostgreSQL::SchemaStatements`
in one `.rb` is a rename; five names crediting five unrelated classes across
rack/actiondispatch/activerecord is a collision.

## Converged shape

Carry the owner through instead of discarding it:

- `buildGlobalRubyCandidates` returns `Map<string, RubyOwner[]>` (or a
  `Set` plus a parallel `Map`) where `RubyOwner` is at least
  `{ package, file, fqn, rubyName }` — every producer already has all four in
  hand at the `add` sites (`extra-surface.ts:1004-1019`).
- `ExtraName` gains an optional `owners?: RubyOwner[]`, populated only for
  `kind === "moved"`.
- `gateFileTagRejections` (`extra-surface.ts:1682`) prints the top owner per
  moved name — `close → rack body_proxy.rb Rack::BodyProxy#close` — so the
  rejection message states the evidence a reviewer needs instead of naming a
  question.
- The per-file report section prints owners under `--verbose` (not by default;
  the report is already wide).

Scope is the oracle + the two render sites. Do NOT change what `moved` MEANS
or how `fileTagVerdict` decides — PR #6229 settled that, and this story is
purely about surfacing attribution the tool already computes and throws away.

## Acceptance criteria

- [ ] `moved` extras carry their Rails owner(s); `buildGlobalRubyCandidates`
      no longer discards the file/fqn it had at each `add` site.
- [ ] A `moved-names` file-tag rejection names the crediting Rails
      `file` + `Class#method` for each listed name.
- [ ] Re-deriving the five libsql.ts owners requires no throwaway script:
      they fall out of a normal `pnpm parity:api:extra --package activerecord` run
      (temporarily removing the `MOVED-BY-SHORT-NAME` clause reproduces the
      rejection).
- [ ] `moved` totals do not move — this is attribution only, not rescoring.
- [ ] `pnpm vitest run scripts/api-compare/extra-surface.test.ts` and
      `pnpm parity:api:extra --package activerecord` pass.
