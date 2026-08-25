---
title: "Key generated defs by constant path, so nested class declarations can emit"
status: closed
est_loc: 150
updated: 2026-08-05
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded by the 2026-08-05 prism-codegen coverage audit: the generator is being retired (0084-wide-call-set-burndown/retire-prism-codegen-tooling), so improving its output is work on a deleted directory. Evidence: 0 shipped lines from codegen:apply, 963 tsc errors across all 10 emitted files, 81.8% whole-corpus node coverage that does not translate to usability."
---

## Context

`unportedMacro` in `scripts/prism-codegen/handlers/structure.ts` excludes a
nested `ClassNode`/`ModuleNode` from class-body macro emission, so
`relation.rb`'s `StrictLoadingScope`, `ExplainProxy`, `WhereChain` and
`ColumnAliasTracker` (`vendor/rails/activerecord/lib/active_record/relation.rb:1310`
and friends) stay unemitted and out of the clean denominator.

The emission itself works — PR #6111 had them emitting correctly as
`export class StrictLoadingScope { static strictLoadingValue() { ... } }`. What
blocks them is the conformance scorer: `scripts/prism-codegen/score.ts` keys a
generated def by its bare short name under the enclosing Rails file, so
`Relation::StrictLoadingScope.strict_loading_value` resolves against the port's
`Relation#strictLoadingValue` — an unrelated method — and reports a divergence
that is a name collision, not a real one. The trails port has
`StrictLoadingScope` as a const object at `packages/activerecord/src/relation.ts:314`,
so there is a real symbol to match; the resolver just cannot reach it.

## Acceptance criteria

- [ ] The scorer keys a generated def by its enclosing constant path, not its
      bare short name, so a nested class's defs resolve against the nested
      class's port symbol.
- [ ] The `ClassNode`/`ModuleNode` arm of `unportedMacro`
      (`handlers/structure.ts`) is deleted, and the
      `codegen-nested-class-declarations` reference in its JSDoc with it.
- [ ] `relation.js.snap` emits `StrictLoadingScope`, `ExplainProxy`,
      `WhereChain` and `ColumnAliasTracker`.
- [ ] The dangling reference at `relation.js.snap:550`
      (`scope = this.strictLoadingValue ? StrictLoadingScope : null`, from
      `relation.rb:1324`) resolves to the emitted declaration. It predates PR
      #6111 — `git show origin/main:scripts/prism-codegen/__snapshots__/relation.js.snap`
      has the identical line with no declaration — and closing it is what makes
      the nested-class emission worth having.
- [ ] `pnpm codegen:score --guard` stays green without a new baseline row.
- [ ] 0 parse errors invariant holds.
