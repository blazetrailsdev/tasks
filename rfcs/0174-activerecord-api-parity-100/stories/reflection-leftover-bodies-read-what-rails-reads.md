---
title: "activerecord: converge the remaining reflection.ts bodies that read something Rails does not"
status: draft
updated: 2026-10-05
rfc: "0174-activerecord-api-parity-100"
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

Surfaced while converging the invented arms in `packages/activerecord/src/reflection.ts` (trails#8527). These bodies were outside that story's arm rows and still differ from Rails:

- `MacroReflection#_klass` compares `demodulize(this.activeRecordRegistryName())` where Rails compares `active_record.name.demodulize` (`vendor/rails/v8.0.2/activerecord/lib/active_record/reflection.rb:426-431`). `activeRecordRegistryName` is a trails-only helper that scans `modelRegistry` for the longest registered key.
- `MacroReflection#normalizeOptions` reads `options.counterCache` and returns a spread copy; Rails does `options.delete(:counter_cache)` and writes `options[:counter_cache] = { active:, column: }` back onto the hash it was given (`reflection.rb:453-472`).
- `ThroughReflection#sourceReflection` returns `null` when `sourceReflectionName()` or `throughReflection` is absent; Rails has one guard, `return unless source_reflection_name`, and then calls `through_reflection.klass._reflect_on_association(source_reflection_name)` unguarded (`reflection.rb:1010-1014`).
- `ThroughReflection#joinPrimaryKey` calls `checkValidityBang()` when the source reflection is nil, an arm `join_primary_key` does not have (`reflection.rb`, `ThroughReflection#join_primary_key`).
- `AbstractReflection#checkValidityOfInverseBang` compares `inverse.name` and `inverse.activeRecord` field by field where Rails tests `inverse_of == self` (`reflection.rb:262-271`).
- `AssociationReflection#deriveForeignKey` and `#automaticInverseOf` wrap the name in `underscore(...)` / `camelize(underscore(...), false)` where Rails interpolates `name` and `options[:as]` directly (`reflection.rb:746-748,827-837`).

## Converged shape

Each body reads what Rails reads: `this.activeRecord.name` in `_klass` (with `activeRecordRegistryName` deleted if nothing else needs it), `hashDelete` plus an in-place write in `normalizeOptions`, the single Rails guard in `sourceReflection`, no validity call in `joinPrimaryKey`, and `rbEqual(this.inverseOf(), this)` in `checkValidityOfInverseBang`. The `underscore` / `camelize` wrappers are removed only if association names and foreign keys already arrive in the spelling Rails' interpolation would produce; if they do not, record why at the call site.

## Acceptance criteria

- [ ] The six bodies above match the cited Rails lines, or the story is blocked with the specific obstacle for the one that cannot.
- [ ] `pnpm parity:api:calls`, `pnpm parity:api:calls:args` and `pnpm parity:api:arms:throws` stay green.
- [ ] `reflection.test.ts`, `associations/inverse-associations.test.ts` and `associations/has-many-through-associations.test.ts` pass.
