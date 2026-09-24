---
title: "naming-rows-recorder-shape-activerecord"
status: ready
updated: 2026-09-24
rfc: "0153-naming-residue-ratchet-and-burndown"
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

RFC 0153 wave W5 follow-up, split from `naming-burndown-activerecord-remaining`. That story's PR closed 21 of activerecord's 31 convergeable naming rows. Four of the remaining rows are misreadings by the call-args recorder. No TS rename can close them, and the story forbids receipting a convergeable row. The fix goes in `scripts/api-compare/` (the extractors or `classifyPair` in `naming-taxonomy.ts`), not in the ported bodies.

| TS file / method                                                | Ruby call                                                                  | Ruby args → TS args           | What the recorder gets wrong                                                                                                                                                                                               |
| --------------------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `relation.ts` `toSql`                                           | `relation.to_sql` (`relation.rb:1214`)                                     | `relation` → `manager`        | The Ruby side records the RECEIVER of a zero-arg `relation.to_sql` as the call's argument. It then pairs with `conn.toSql(manager)`, the ratified eager builder (CLAUDE.md § "`Relation` is evaluated by an async query"). |
| `scoping/default.ts` `buildDefaultScope`                        | `scope_obj.scope` (`scoping/default.rb:161`)                               | `scopeObj` → `combinedScope`  | Same recorder shape: the zero-arg reader's receiver is recorded as its argument. The TS local `combinedScope` is already the Rails name.                                                                                   |
| `migration.ts` `migrationsStatus`                               | `IllegalMigrationNameError.new(file)` inside `raise` (`migration.rb:1324`) | `file` → `normalizedVersions` | The Ruby side records the `new` in `raise X.new(file)`, while the TS extractor drops a thrown construction (`isThrownConstruction`, `extract-ts-api.ts`). The Ruby `new` then pairs with an unrelated `new Set(...)`.      |
| `relation/finder-methods.ts` `raiseRecordNotFoundExceptionBang` | `name.pluralize(not_found_ids.size)` (`relation/finder_methods.rb:432`)    | `size` → `name`               | activesupport core-ext methods port in function form (`pluralize(name, n)`), with the receiver as the first argument. The comparison does not shift it off.                                                                |

## Acceptance criteria

- [ ] The recorder or `classifyPair` handles each of the three shapes: a zero-arg call's receiver, a construction inside `raise`/`throw`, and a core-ext function-form receiver. Each gets a unit test in `scripts/api-compare/*.test.ts`.
- [ ] `pnpm parity:api:calls:args:report` no longer lists the four rows as `burndown`.
- [ ] No row is receipted to get there.
