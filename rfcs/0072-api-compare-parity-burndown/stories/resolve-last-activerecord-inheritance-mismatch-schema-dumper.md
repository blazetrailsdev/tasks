---
title: "Resolve the last activerecord parity:api mismatch: ConnectionAdapters::SchemaDumper super-mismatch"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
pr: 6128
claim: "2026-08-05T14:47:37Z"
assignee: "resolve-last-activerecord-inheritance-mismatch-schema-dumper"
blocked-by: null
closed-reason: null
---

## Context

This is the **last remaining `parity:api` mismatch in activerecord**. A fresh
`pnpm build && pnpm parity:api` on `main` (0394f52da, 2026-08-05) reports:

```text
activerecord — 6148/6148 methods (100%) | files: 277/277
             | inheritance: 209/210 (99.5%)
             | arity: 3923/3923 (100%, 1 excluded)
```

Methods, files and arity are all at 100%. The single inheritance mismatch, from
`scripts/api-compare/output/api-comparison.json`:

```json
{
  "reason": "super-mismatch",
  "rubyFile": "connection_adapters/abstract/schema_dumper.rb",
  "rubyFqn": "ActiveRecord::ConnectionAdapters::SchemaDumper",
  "rubySuper": "SchemaDumper",
  "tsFile": "connection-adapters/abstract/schema-dumper.ts",
  "tsName": "SchemaDumper",
  "tsSuper": null,
  "tsChain": []
}
```

Rails declares `class SchemaDumper < SchemaDumper`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_dumper.rb:5`)
— the adapter-layer dumper subclasses `ActiveRecord::SchemaDumper`
(`schema_dumper.rb:10`), and the base's `table` calls the private `column_spec`
that only the subclass defines.

trails deliberately collapsed the two into one class. The header of
`packages/activerecord/src/connection-adapters/abstract/schema-dumper.ts:1-25`
records why: a static `extends` across the two modules is an ESM
temporal-dead-zone cycle (base ↔ subclass), so the adapter-layer members ship as
`this`-typed mixin functions over a `SchemaDumperMixinHost` interface, and the
base class (`packages/activerecord/src/schema-dumper.ts:354`) assigns them onto
its own prototype through thin `protected` wrappers. The file then re-exports
`SchemaDumper` from the base module (`schema-dumper.ts:25`), so the checker
resolves the name to the base class, whose `ancestorChain` is empty — hence
`tsSuper: null`.

So this is a **known, reasoned deviation, not unreviewed drift**. What is
missing is that nothing in `parity:api` records it: the checker has
`RUBY_ONLY_CLASSES` (compare.ts:889-890) for classes excluded from the
inheritance denominator, but no per-entry reasoned exclusion for a super
mismatch that is intentional. The result is a permanent 209/210 that reads as
outstanding work and cannot be turned into a ratchet at 100%.

## Acceptance criteria

- Decide and record which of the two is correct, with the evidence in the PR
  body:
  1. **Converge** — restore a real subclass relationship (e.g. define the
     adapter-layer class in the same module as the base, or break the cycle so
     `extends` is expressible), deleting the mixin-host indirection. Only take
     this arm if the TDZ cycle documented at `schema-dumper.ts:1-25` is
     genuinely resolvable; re-verify it rather than assuming, and confirm the
     bare-base construction path (see
     `synchronous-bare-base-dumper-construction`, RFC 0056) still works.
  2. **Record the exclusion** — add a reasoned per-entry inheritance exclusion
     mechanism (mirroring the reasoned excludes used elsewhere in
     `scripts/api-compare/`), with this entry citing the ESM cycle and the
     single-class design, so the mismatch stops counting and the reason is
     reviewable.
- Do NOT resolve it by renaming or by adding a vestigial `extends` that no
  runtime path uses — a fake parent is worse than a recorded deviation.
- If arm 2 is taken, the mechanism must be a reasoned list (reason string
  required per entry), not a bare allowlist, and covered by a test in
  `scripts/api-compare/`.
- `pnpm parity:api` reports activerecord `inheritance: 210/210 (100%)`, taking
  activerecord to 100% on every scored axis (methods, files, inheritance,
  arity). State the before/after totals table in the PR body.
- No other package's inheritance total moves.

## Out of scope

Extra surface. `pnpm parity:api:extra --package activerecord --novel-only` still
reports a large novel population; that axis is advisory per this RFC's
non-goals and is burned down by the per-file extra-surface stories.
