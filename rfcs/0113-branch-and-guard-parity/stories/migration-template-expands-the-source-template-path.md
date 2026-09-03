---
title: "migration_template takes a source template PATH and expands it through find_in_source_paths"
status: draft
updated: 2026-09-03
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rails::Generators::Migration#migration_template`
(`railties/lib/rails/generators/migration.rb:56-68`) expands the **source**
template path found in the generator's source paths:

```ruby
def migration_template(source, destination, config = {})
  source = File.expand_path(find_in_source_paths(source.to_s))

  set_migration_assigns!(destination)

  dir, base = File.split(destination)
  numbered_destination = File.join(dir, ["%migration_number%", base].join("_"))

  file = create_migration numbered_destination, nil, config do
    ERB.new(::File.binread(source), trim_mode: "-", eoutvar: "@output_buffer").result(binding)
  end
  Rails::Generators.add_generated_file(file)
end
```

`packages/trailties/src/generators/migration.ts:68-86` takes `source` as a
builder **function** rather than a template path, so there is no source path to
find or expand; it expands the DESTINATION against `destinationRoot` instead, and
`File.split` / the `"%migration_number%"` placeholder are replaced by a
pre-computed `nextNumber`. PR #7462 baselined the call-argument row
(`trailties/generators/migration.json`, `expand_path(ref:findInSourcePaths)`)
when `File` left `CORE_CLASS_RECEIVERS`.

The divergence is the source-as-callback signature, which every trails generator
call site depends on — converging it is a signature change across
`packages/trailties/src/generators/`, not a one-line edit, which is why it is its
own story rather than a fix inside #7462.

## Acceptance criteria

- `migrationTemplate` takes Rails' `(source, destination, config = {})` with
  `source` a template PATH, and its first statement is
  `File.expandPath(findInSourcePaths(String(source)))`.
- `find_in_source_paths` exists on the generator host with Rails' name and its
  "couldn't find X in any of your source paths" error, or the story is
  `pnpm tasks block`ed on the story that adds it — do not stub it.
- `File.split(destination)` and the literal `"%migration_number%"` placeholder
  are spelled as Rails spells them, with `nextMigrationNumber` filling the
  placeholder where Rails fills it.
- Every call site in `packages/trailties/src/generators/` moves to the new
  signature in the same PR; no callback-taking overload is left behind.
- The `expand_path(ref:findInSourcePaths)` row is removed from
  `scripts/api-compare/call-mismatches-exclude/trailties/generators/migration.json`
  (only-shrink: delete by hand, no reseed) and `pnpm parity:api:calls:args` is green.
