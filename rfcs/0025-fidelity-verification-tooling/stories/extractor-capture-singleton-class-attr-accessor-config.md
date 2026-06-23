---
title: "api-compare: capture singleton_class.attr_accessor module config as Base statics"
status: in-progress
updated: 2026-06-23
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 3993
claim: "2026-06-23T13:22:50Z"
assignee: "extractor-capture-singleton-class-attr-accessor-config"
blocked-by: null
---

## Context

Follow-up to `extractor-capture-metaprogrammed-ruby-surface` (RFC 0025).
`pnpm api:extra --package activerecord --novel-only` still flags `readingRole`
and `writingRole` as novel in `base.ts`.

In vendored Rails these are NOT `class_attribute` (the original story's Context
mis-attributed them) — they are `singleton_class.attr_accessor :writing_role`
/ `:reading_role` on the top-level `ActiveRecord` module
(`vendor/rails/activerecord/lib/active_record.rb:265,268`), plus ~40 sibling
config flags (`disable_prepared_statements`, `schema_format`, `queues`, …).
trails ports this module-level config as static methods on `Base`.

Two gaps make them novel:

1. `singleton_class.attr_accessor` is a `command_call` with a `singleton_class`
   receiver. `extract-ruby-api.rb`'s `process_command` dispatches `attr_accessor`
   but buckets into `instanceMethods` (not classMethods) and attaches to the
   current entity (`ActiveRecord` module), not its singleton.
2. Even recorded correctly, the methods live on the `ActiveRecord` module
   entity, whereas the TS ports are on `Base` — a cross-entity
   module-config → Base-static mapping that `extra-surface.ts` does not model.

## Acceptance criteria

- `singleton_class.attr_accessor`/`attr_reader`/`attr_writer` is captured as
  class methods of the enclosing entity (not instance methods).
- The api-compare consumer maps the top-level `ActiveRecord` module config
  surface to `Base` statics (or otherwise admits it to base.ts's allowed set)
  so `readingRole`/`writingRole` and siblings are no longer novel.
- `pnpm api:compare` gate + the api-compare test suites still pass.
