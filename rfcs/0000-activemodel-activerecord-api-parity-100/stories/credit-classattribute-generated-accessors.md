---
title: "Model classAttribute() in the TS extractor so the 21 class_attribute triples Ruby's extractor already credits stop scoring as declaration-only"
status: draft
updated: 2026-08-31
rfc: "0000-activemodel-activerecord-api-parity-100"
cluster: null
packages:
  - activemodel
  - activerecord
deps: []
deps-rfc: []
est-loc: 240
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby `class_attribute :foo` defines `foo`, `foo?` and `foo=`, and
`extract-ruby-api.rb` models the macro (`:926` for the bare-command form,
`:994` for the parenthesized one), so Rails is credited for all three.

trails' twin is `classAttribute()` from `@blazetrails/activesupport`
(`packages/activesupport/src/class-attribute.ts`), called inside an `included`
block — the shape CLAUDE.md ratifies as the port of
`included do class_attribute :foo end`. It installs a real accessor pair on the
class at load time. `extract-ts-api.ts` models no trails generator at all, so
every one of those members scores as declaration-only against the host
interface that types it.

21 methods, four files, both packages:

| file | n | call site |
| --- | --- | --- |
| activemodel `attribute_methods.rb` — `attribute_aliases`, `attribute_method_patterns` triples | 6 | `activemodel/src/attribute-methods.ts:510`, typed at `:112-118` |
| activemodel `validations.rb` — `_validators` triple | 3 | `activemodel/src/validations.ts:75`, typed at `:141` |
| activerecord `attribute_methods/time_zone_conversion.rb` — `skip_time_zone_conversion_for_attributes`, `time_zone_aware_types` triples | 6 | `activerecord/src/attribute-methods/time-zone-conversion.ts:29,33` |
| activerecord `model_schema.rb` — `table_name_prefix`, `table_name_suffix` triples | 6 | `activerecord/src/model-schema.ts`, typed at `:285` |

Rails sides: `activemodel/lib/active_model/attribute_methods.rb`,
`activemodel/lib/active_model/validations.rb:39`,
`activerecord/lib/active_record/attribute_methods/time_zone_conversion.rb`,
`activerecord/lib/active_record/model_schema.rb:37-52`.

One TS name credits the whole Ruby triple — the artifact maps
`attribute_aliases`, `attribute_aliases?` and `attribute_aliases=` all to
`attributeAliases` — so one extractor arm closes all 21 at once. That is why
this is one story spanning both packages rather than four.

Depends on nothing; runs in parallel with the other two bucket-A stories.

## Acceptance criteria

- `extract-ts-api.ts` credits the accessor `classAttribute()` installs, on the
  class or module whose `included` block calls it, as a bodied member of the
  file that makes the call — the structural twin of `extract-ruby-api.rb`'s
  `class_attribute` arm.
- A test in `scripts/api-compare/` pins the positive case AND the negative:
  a `classAttribute` call with a non-literal name, or on a receiver the arm
  cannot resolve, credits nothing. A too-generous arm silently invents
  coverage.
- activemodel `attribute_methods.rb` reaches **42/42** and `validations.rb`
  **45/45**; activerecord `attribute_methods/time_zone_conversion.rb` reaches
  **16/16** and `model_schema.rb` **65/65**.
- activemodel package total ≥ **746/754**; activerecord ≥ **6172/6362**.
- Effect on activesupport and every other package that calls `classAttribute`
  is reported in the PR body; no total falls, and marks move only via
  `:tighten`.
- No host-interface field is converted to a `declare` as part of the fix — the
  extractor refuses to credit a bodyless signature by design.
