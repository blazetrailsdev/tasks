---
title: "activerecord joins the inlined-from missing-tag arm"
status: ready
updated: 2026-10-14
rfc: "0188-module-initialize-inlined-into-constructors"
cluster: null
packages: []
deps:
  - activerecord-core-initialize-is-bases-constructor
  - activerecord-fixtures-timezone-and-controller-runtime-initialize-inlined
  - activemodel-inlines-api-attributes-and-serialize-cast-value-initialize
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/lint-inlined-from.ts` `MISSING_TAG_PACKAGES` gates the missing-tag arm per package. trails#8888 converted the adapter, pool and Deduplicable constructors but could not enroll `activerecord`: enrolling it reds on constructors owned by sibling 0188 stories that had not landed:

- `Base#constructor` — `Inheritance::ClassMethods#new` (`vendor/rails/v8.0.2/activerecord/lib/active_record/inheritance.rb:56-78`), `Core#initialize` (`core.rb:471-482`), `ActiveModel::API#initialize` (`activemodel/lib/active_model/api.rb:80-84`) inlined untagged → `activerecord-core-initialize-is-bases-constructor`.
- `Type::Date` / `DateTime` / `Time` constructors — `Type::Internal::Timezone#initialize` → `activerecord-fixtures-timezone-and-controller-runtime-initialize-inlined`.
- `Normalization::NormalizedValueType#constructor` — `ActiveModel::Type::SerializeCastValue#initialize` → `activemodel-inlines-api-attributes-and-serialize-cast-value-initialize`.

Each of those stories' acceptance criteria also says "enroll the package", which none can do alone; this story owns the enrollment.

## Acceptance criteria

- `"activerecord"` is added to `MISSING_TAG_PACKAGES`, and `pnpm parity:api:inlined` is green.
- The `MISSING_TAG_PACKAGES` expectation in `scripts/api-compare/lint-inlined-from.test.ts` is updated.
