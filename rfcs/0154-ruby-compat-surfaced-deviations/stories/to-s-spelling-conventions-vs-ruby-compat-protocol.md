---
title: "to-s-spelling-conventions-vs-ruby-compat-protocol"
status: draft
updated: 2026-11-21
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`docs/ruby-ts-conventions.md` (from `scripts/parity/conventions.ts:2034`) translates Ruby `to_s` / `to_str` as `toString`, but ruby-compat dispatches the protocol by `toS` / `toStr`: `rbObjAsString` (`packages/ruby-compat/lib/object.ts`, MRI `rb_obj_as_string`, `vendor/ruby/v3.3.11/string.c:1653`) calls `toS`, and the implicit conversions in `packages/ruby-compat/lib/string/support.ts:71-85` call `toStr`. So `ActiveSupport::Multibyte::Chars` (`vendor/rails/v8.0.2/activesupport/lib/active_support/multibyte/chars.rb:50-51`) carries `toString`, `toS` and `toStr` (trails#10525): taking out `toS` broke `quote` of a Chars on every adapter.

## Acceptance criteria

- [ ] The conventions table and ruby-compat's protocol dispatch agree on one spelling for `to_s` and one for `to_str`.
- [ ] `Chars` defines one member per Rails alias, and `parity:api:extra` reports no duplicate.
