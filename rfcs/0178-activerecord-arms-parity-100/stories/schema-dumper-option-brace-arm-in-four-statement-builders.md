---
title: "activerecord: SchemaDumper statement builders wrap trailing options without an invented arm"
status: closed
updated: 2026-10-10
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-10-09T20:09:43Z"
assignee: "core-inherited-seeding-leaves-the-generated-modules-and-find-by-cache-readers"
blocked-by: null
closed-reason: "PERMANENT: the repo owner ratified the brace arm on 2026-10-09 in trails packages/activerecord/CLAUDE.md § 'A dumped statement wraps its trailing options in braces' (a kwargs language shortcoming). On trails main @ ddd629745a the builders in schema-dumper.ts and postgresql/schema-dumper.ts carry '@inventedArm if — PERMANENT', no receipt names this story, and the invented-arm report lists no schema-dumper pair"
---

## Context

`SchemaDumper` emits a TypeScript schema, so a statement Rails writes as
`"  #{parts.join(', ')}"` (`vendor/rails/v8.0.2/activerecord/lib/active_record/schema_dumper.rb:341`)
is written as a call whose trailing options are wrapped in braces only when
there are any:

```ts
const [fromTable, toTable, ...opts] = parts;
const optStr = opts.length > 0 ? `, { ${opts.join(", ")} }` : "";
```

That ternary is an `if` Rails' body does not take. It is the one invented arm
left on each of these pairs in
`pnpm parity:api:arms:report --package=activerecord --direction=invented`:

- `packages/activerecord/src/schema-dumper.ts#foreignKeys` against
  `schema_dumper.rb:316-345` (`foreign_keys`). It carries
  `@inventedArm if — CONVERGEABLE` pointing at this story.
- `schema-dumper.ts#indexes` against `schema_dumper.rb:232-244`.
- `schema-dumper.ts#indexesInCreate` against `schema_dumper.rb:246-262`.
- `schema-dumper.ts#checkConstraintsInCreate` against `schema_dumper.rb:283-303`,
  twice, beside its `_hookHost` guard, which `foreignKeys` no longer has.

Rails' own `format_index_parts` (`schema_dumper.rb:358-364`) is where the
Ruby side already wraps a Hash in braces, so the wrap has a Rails home; the
four call sites above each re-derive it.

## Acceptance criteria

- [ ] The four bodies build their statement with no arm Rails' body lacks, and
      the dumped TypeScript is byte-identical for every existing schema-dumper
      test.
- [ ] `@inventedArm if` is deleted from `foreignKeys`.
- [ ] `pnpm parity:api:arms:report --package=activerecord --direction=invented`
      lists none of the four pairs for this arm.
