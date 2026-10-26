---
title: "mattr/cattr store a callable default as-is; only a block is yielded"
status: draft
updated: 2026-10-26
rfc: "0101-activesupport-out-of-closure-surface"
cluster: null
packages: ["activesupport"]
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

Rails' `mattr_reader` / `mattr_writer` (`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/module/attribute_accessors.rb:69`, `:134`) compute the default as `(block_given? && default.nil?) ? yield : default`. A `default:` that is a Proc or lambda is stored as-is, and only a block is called.

trails' `setMattrDefault` (`packages/activesupport/src/module-ext.ts:62-63`) does `typeof rawDefault === "function" ? rawDefault() : rawDefault`. It calls any function default, so a class or callable that is meant to be the stored value gets invoked instead. This surfaced in the deferred Action Cable redis adapter work (trails#9319): a `cattr_accessor :redis_connector, default: ->(config) { ... }` had to be wrapped in another function to survive.

## Acceptance criteria

- [ ] `mattrReader` / `mattrWriter` / `mattrAccessor` (and cattr) take the block as a separate trailing block argument, per the ruby-compat `block()` convention, and store `default` unchanged even when it is a function.
- [ ] Callers that relied on a function default being called move to the block form.
- [ ] A test ports the Rails "default value" cases from `activesupport/test/core_ext/module/attribute_accessor_test.rb`, including a lambda default that is stored, not called.
