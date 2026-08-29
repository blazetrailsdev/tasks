---
title: "Parameter-name drift: activerecord migrations, encryption, validations and the rest"
status: done
updated: 2026-08-29
rfc: "0128-parameter-name-drift-burndown"
cluster: fidelity
packages:
  - activerecord
deps:
  - parity-api-compares-parameter-names-beside-arity
deps-rfc: []
est-loc: 212
priority: 3
pr: 7203
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The parameter-name check landed by `parity-api-compares-parameter-names-beside-arity`
(RFC 0126) reports **53 positions over 47 matched pairs** in the remaining activerecord files — migrations, encryption, validations, reflection, tasks
where the TS parameter is not the Rails identifier camelCased. CLAUDE.md makes
that spelling the rule ("a local or parameter keeps the Rails identifier,
camelCased — Ruby `stmt` is `stmt`, not `statement`"); it went unmeasured until
this check, so the drift accumulated silently while arity read 100%.

Rows by file:

- `migration.rb` — 6
- `tasks/database_tasks.rb` — 5
- `delegated_type.rb` — 4
- `reflection.rb` — 4
- `sanitization.rb` — 3
- `connection_handling.rb` — 2
- `counter_cache.rb` — 2
- `encryption/cipher/aes256_gcm.rb` — 2
- `encryption/scheme.rb` — 2
- `migration/command_recorder.rb` — 2
- …and 21 further files with fewer rows each.

A sample, in the artifact's own format (`output/param-name-mismatches.json`):

```text
  autosave_association.rb#reload @0  `options` → `inheritedReload`
  connection_handling.rb#connected_to? @1  `shard` → `fn`
  connection_handling.rb#connected_to_all_shards @1  `preventWrites` → `fn`
  counter_cache.rb#_create_record @0  `attributeNames` → `superFn`
  counter_cache.rb#counter_cache_column? @0  `name` → `columnName`
  database_configurations.rb#find_db_config @0  `env` → `envName`
  database_configurations/hash_config.rb#initialize @2  `configurationHash` → `configuration`
  database_configurations/url_config.rb#initialize @3  `configurationHash` → `configuration`
```

## Verifying

```bash
API_COMPARE_FORCE=1 pnpm parity:api --package activerecord --params
```

lists every remaining position as `file:method  @position  ruby \`x\` ts \`y\``.
The story is done when that list is empty for the scope above.

Read each row before renaming it — see the RFC's "three shapes" section. A
union-type name (`columnOrOptions`) still takes the Rails identifier: the type
describes what the argument may be, the name describes what it is. A positional
misalignment — a dropped Rails parameter reported as a rename of its neighbour —
belongs to `param-drift-positional-misalignment-is-a-dropped-parameter` and is
left alone here.

## Acceptance criteria

- Every parameter in scope carries the Rails identifier, camelCased per
  `docs/ruby-ts-conventions.md`, verified against `vendor/rails`.
- No behaviour change and no test renamed; `pnpm parity:api` methods and arity
  figures unmoved, `parity:api:calls` and `parity:api:calls:args` no new row.
- There is no exclude register for parameter names and none is added. A position
  that genuinely cannot carry the Rails name is a `pnpm tasks block` naming the
  language shortcoming.
