---
title: "Port ActiveStorage::Reflection with its reflection, presence and strict-loading tests"
status: done
updated: 2026-10-31
rfc: "0209-activestorage-port"
cluster: as-attached
packages: ["activestorage"]
deps: ["activestorage-attached-many"]
deps-rfc: []
est-loc: 250
priority: null
pr: trails#9546
claim: "2026-10-31T18:37:04Z"
assignee: "activestorage-reflection-and-validations"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activestorage/lib/active_storage/reflection.rb` (74): `HasAttachedReflection#variant`
/ `named_variants`, `HasOneAttachedReflection` / `HasManyAttachedReflection`
(`macro`), `ReflectionExtension#add_attachment_reflection` and
`reflection_class_for`, `ActiveRecordExtensions::ClassMethods`
`reflect_on_all_attachments` / `reflect_on_attachment` (`:59-72`).
`app/models/active_storage/named_variant.rb` (21). Tests:
`test/models/reflection_test.rb` (4), `presence_validation_test.rb` (2),
`strict_loading_test.rb` (2).

## Acceptance criteria

- The reflection classes and extensions are ported onto activerecord's
  reflection, installed as the engine's `active_storage.reflection`
  initializer will install them.
- The three test files pass.
