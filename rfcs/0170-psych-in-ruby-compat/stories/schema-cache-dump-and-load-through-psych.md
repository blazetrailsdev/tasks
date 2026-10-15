---
title: "SchemaCache#dump_to / _load_from through YAML.dump / YAML.unsafe_load; delete the hand-built !ruby/object tags"
status: in-progress
updated: 2026-10-15
rfc: "0170-psych-in-ruby-compat"
cluster: fidelity
packages: ["activerecord"]
deps:
  [
    "move-activesupport-yaml-into-ruby-compat-psych",
    "psych-load-tags-dump-tags-and-domain-types",
    "psych-libyaml-seam-without-top-level-await",
  ]
deps-rfc: []
est-loc: 250
priority: null
pr: trails#8934
claim: "2026-10-15T13:11:53Z"
assignee: "change-generator-edits-compose-yaml-through-psych-load-file"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/schema_cache.rb:228-240`
(`_load_from`: `Marshal.load` for `.dump`, else `YAML.unsafe_load`) and
`:405-414` (`dump_to`: `Marshal.dump` / `YAML.dump(self)`). trails
(`packages/activerecord/src/connection-adapters/schema-cache.ts:23-107,315-321`)
hand-builds npm `CollectionTag`s for nine `!ruby/object:` classes
(`RUBY_OBJECT_CLASSES`) and imports the npm `CollectionTag` / `YAMLMap`
types. Psych does this generically once #8254's protocol exists: it dumps
through `encode_with` (`SchemaCache#encode_with`, `Column#encode_with`,
`IndexDefinition`, `SqlTypeMetadata`) and revives through `init_with` and
`rbPathToClass`. trails#8520 (story
`ruby-compat-has-no-marshal-for-schema-cache-and-debug`) ported the `.dump`
arm: `_loadFrom` / `dumpTo` call `Marshal.load` / `Marshal.dump`
(`schema_cache.rb:232-233,408-409`), and the nine classes are registered under
their Ruby constant names.

## Acceptance criteria

- [ ] `dumpTo` writes `YAML.dump(this)` and `_loadFrom` reads
      `YAML.unsafeLoad(data)`. `RUBY_OBJECT_CLASSES`, `RUBY_OBJECT_TAGS` and
      every npm `yaml` type import are deleted.
- [ ] A `.dump` filename still goes through `Marshal.load` / `Marshal.dump`.
- [ ] `schema-cache.test.ts` (including the Rails-generated YAML fixtures)
      stays green. Dump output is byte-compared against a Rails-produced file
      if one exists under `test-helpers/support`.

## Verification

`pnpm vitest run packages/activerecord/src/connection-adapters/schema-cache.test.ts`.
