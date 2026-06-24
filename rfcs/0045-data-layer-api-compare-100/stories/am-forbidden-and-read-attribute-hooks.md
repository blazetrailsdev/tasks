---
title: "am-forbidden-and-read-attribute-hooks"
status: done
updated: 2026-06-24
rfc: "0045-data-layer-api-compare-100"
cluster: activemodel
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 4043
claim: "2026-06-24T00:30:40Z"
assignee: "am-forbidden-and-read-attribute-hooks"
blocked-by: null
---

## Context

Three activemodel hook methods are missing, each surfacing in several files via
module inclusion:

- `sanitize_forbidden_attributes` (`ActiveModel::ForbiddenAttributesProtection`,
  `vendor/rails/activemodel/lib/active_model/forbidden_attributes_protection.rb`)
  — missing in `forbidden-attributes-protection.ts` (1/2), `api.ts`,
  `model.ts`, `attribute-assignment.ts`.
- `read_attribute_for_validation` (`ActiveModel::Validations`,
  `validations.rb:437` `alias :read_attribute_for_validation :send`) — missing
  in `validations.ts`, `api.ts`, `model.ts`.
- `read_attribute_for_serialization` (`ActiveModel::Serialization`) — missing in
  `serialization.ts`, `serializers/json.ts`.

These are small, well-defined methods (sanitize unwraps forbidden params;
`read_attribute_for_*` default to `send`/attribute read). trails performs the
equivalent behavior inline; the named hook may be portable directly or skip-
listed if there's no override seam.

## Acceptance criteria

- `sanitize_forbidden_attributes`, `read_attribute_for_validation`,
  `read_attribute_for_serialization` each ported on their defining host
  (module-mixin `this`-typed function, inherited by the including files) OR a
  `SKIP_GROUPS` entry with reason.
- Where ported, a test matching the Rails test name (e.g. forbidden-attributes
  protection raising on un-permitted params).
- `pnpm api:compare --package activemodel` shows
  forbidden-attributes-protection.ts, api.ts, model.ts, attribute-assignment.ts,
  validations.ts, serialization.ts, serializers/json.ts at 100%.
