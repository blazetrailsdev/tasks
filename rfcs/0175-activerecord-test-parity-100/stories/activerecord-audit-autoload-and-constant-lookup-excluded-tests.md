---
title: "activerecord: sort the 29 autoload / constant-lookup exclusions into ratified and portable"
status: ready
updated: 2026-09-30
rfc: "0175-activerecord-test-parity-100"
cluster: unported-tests
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Exclusions whose reason is Zeitwerk, `Object.autoload`, `Module#ancestors` or constant-path lookup:

- `schema_loading_test.rb` — (whole file)
  reason: Tests ActiveSupport.on_load / Zeitwerk autoload hooks triggered from background threads. No Node.js equivalent; ES module loading is synchronous and non-concurrent.
- `reload_models_test.rb` — (whole file)
  reason: Tests class reloading via ActiveSupport::Dependencies / Zeitwerk in a forked process. No Node.js equivalent; ES modules are cached for the process lifetime.
- `inheritance_test.rb` — "compute type no method error"; "compute type on undefined method"; "compute type argument error"
  reason: Registers an Object.autoload for a model whose file raises during require, so the exception surfaces from constantize inside compute_type. JS has no autoload/require hook — a module either resolves at import time or the
- `inheritance_test.rb` — "base class activerecord error"
  reason: Asserts `Class.new { include ActiveRecord::Inheritance }` raises ActiveRecordError via Ruby's Module#included hook. Trails mixes modules in statically; there is no runtime include on an arbitrary class to guard.
- `inheritance_test.rb` — "new with autoload paths"
  reason: Stands up a Zeitwerk loader at runtime so STI dispatch resolves a constant from an autoload path. JS has no runtime constant autoloading; trails resolves subclasses via explicit registerSubclass.
- `inheritance_test.rb` — "instantiation doesnt try to require corresponding file"
  reason: Exercises Ruby constant-lookup/dependencies integration: a DB type with no top-level constant raises RecordNotFound, then const_set on the test class vs on Firm changes which constant compute_type sees. JS has no const_m
- `modules_test.rb` — "module spanning associations"; "module spanning has and belongs to many associations"; "associations spanning cross modules"; "find account and include company"; "eager loading in modules"
  reason: Ruby Module#ancestors / constant-path lookup for cross-module association resolution. No JS equivalent for namespace-scoped class discovery.
- `base_test.rb` — "new threads get default the default connection handler"; "changing a connection handler in a main thread does not poison the other threads"; "connection_handler can be overridden"; "marshal round trip"; "marshal inspected round trip"; "marshal new record round trip"; "marshalling with associations 6 1"; "marshalling with associations 7 1" …
  reason: GVL / Ruby Thread semantics, Marshal binary serialization, Encoding.default_internal, with_env_tz (process-level ENV["TZ"] reload), and Ruby Module#inspect for namespaced generated-method modules — all Ruby-only with no

CLAUDE.md § "Trails has no autoloader" ratifies the absence of Zeitwerk — cases that test the loader
itself (`schema_loading_test.rb`, `reload_models_test.rb`, the Zeitwerk STI case) are allowed residue.
Constant-path resolution for associations (`modules_test.rb`) is not the loader: trails resolves class
names through `constantize` over the seated namespaces (§ "Call-time constant resolution"), so those are portable.

## Acceptance criteria

- [ ] Each exclusion's reason is rewritten to cite § "Trails has no autoloader" (ratified residue), or the case is ported and its entry deleted.
- [ ] `modules_test.rb`'s five cases are ported over `constantize` with namespaced canonical models.

## Verification

```bash
pnpm parity:test --package activerecord --missing && pnpm vitest run scripts/parity/unported-files.test.ts scripts/parity/unported-live-test.test.ts
```
