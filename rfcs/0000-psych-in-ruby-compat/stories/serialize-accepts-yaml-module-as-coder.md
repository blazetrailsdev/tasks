---
title: "build_column_serializer: port the `coder == ::YAML` arm"
status: draft
updated: 2026-09-29
rfc: "0000-psych-in-ruby-compat"
cluster: fidelity
packages: ["activerecord"]
deps:
  ["move-activesupport-yaml-into-ruby-compat-psych", "psych-libyaml-seam-without-top-level-await"]
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activerecord/lib/active_record/attribute_methods/serialization.rb:214`:
`if coder == ::YAML || coder == Coders::YAMLColumn`. trails
(`packages/activerecord/src/attribute-methods/serialization.ts:72`) checks only
`coder === YAMLColumn`, because until the move there was no `YAML` constant to
name. So `serialize(:x, { coder: YAML })` today falls to the
`respond_to?(:new)` / `ColumnSerializer` arms.

## Acceptance criteria

- [ ] `coder === YAML || coder === YAMLColumn` (`YAML` from
      `@blazetrails/ruby-compat/yaml`) builds a `YAMLColumn`, in Rails' branch
      order.
- [ ] Add a `serialized-attribute.trails.test.ts` case. Rails' own suite has
      no `coder: YAML` test (checked with grep over `vendor/rails/v8.0.2/activerecord/test/cases/`).

## Verification

`pnpm vitest run packages/activerecord/src/serialized-attribute.test.ts`.
