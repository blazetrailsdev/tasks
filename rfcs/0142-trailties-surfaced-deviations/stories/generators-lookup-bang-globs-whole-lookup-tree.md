---
title: "Generators.lookupBang globs every lookup path, not only trails/"
status: draft
updated: 2026-11-10
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rails::Command::Behavior.lookup!` (`vendor/rails/v8.0.2/railties/lib/rails/command/behavior.rb:56-65`) globs every `$LOAD_PATH` entry with `file_lookup_paths`, which is `["{rails/generators,generators}", "**", "*_generator.rb"]` (`railties/lib/rails/generators.rb`). As a result, `Generators.public_namespaces` lists `test_unit:*`, `active_record:*`, and any gem's generators.

trails' `Generators.lookupBang` (`packages/trailties/lib/generators.ts`) walks `LOAD_PATH` × `lookupPaths()` but descends only into the `trails/` subtree. trails#9941 kept that restriction because `packages/trailties/test/generators.trails.test.ts` "lookup finds a generator for every generator directory" pins `publicNamespaces()` to `trails:*` only.

## Acceptance criteria

- `lookupBang` globs the whole `{trails/generators,generators}/**/*-generator` tree on each `LOAD_PATH` entry, as `behavior.rb:56-65` does.
- `generators.trails.test.ts` is converged so its expectation matches what Rails would list. Do not rename the test.
- `bin/trails generate --help` lists non-`trails:` generators (for example `mailbox` from actionmailbox), minus the hidden namespaces.
