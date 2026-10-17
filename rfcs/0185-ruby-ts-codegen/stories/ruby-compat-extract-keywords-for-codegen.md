---
title: "ruby-compat ports rb_extract_keywords for keywords after a splat"
status: draft
updated: 2026-10-17
rfc: "0185-ruby-ts-codegen"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

When a Ruby method takes `*rest` followed by keywords or a block, the codegen generator pops the keywords off the rest array through a generated-runtime shim, `rbExtractKeywords` (`scripts/codegen/src/runtime-shim.ts`). That shim is used 31 times in generated activerecord. The repo owner ruled that no generated runtime ships. Real Ruby semantics JS cannot express belong in ruby-compat.

Ruby's own split is `rb_extract_keywords` (`vendor/ruby/v3.3.11/class.c:2395`). It separates the symbol-keyed pairs of a trailing Hash from the rest. That is the case of a keyword argument after a splat, which has no JS form: JS has no keyword arguments, and trails passes keywords as a trailing options object.

## Acceptance criteria

- [ ] ruby-compat exports the `rb_extract_keywords` port with a `class.c` citation and tests: a trailing options object is split off, a non-options last element is left in place, and an empty rest stays empty.
- [ ] The generator emits the ruby-compat call; `rbExtractKeywords` is deleted from `runtime-shim.ts`.
