---
title: "CLAUDE.md: plain-object and class modules, module super inlined"
status: draft
updated: 2026-10-19
rfc: "0197-plain-object-modules-replace-ruby-compat-module"
cluster: design
packages: ["ruby-compat"]
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

This RFC § Design fixes the module shapes and the module-`super` rule. CLAUDE.md
still describes `Module` instances in two places: § "`singleton_class` is a
per-object subclass" (the sentence that a ruby-compat `Module` instance is a plain
object with a real singleton class) and § "Ruby protocol methods…" (the
lazy_route_set bullet about splicing beneath the url-helpers module). § "Module
mixins" names plain objects and `include()` but not the enumerability convention,
class modules, or module-includes-module.

## Acceptance criteria

- § "Module mixins" states the plain-object convention (enumerable own members
  are instance methods, non-enumerable own members are singleton methods and
  module state), the class-module spelling and when to use it, and the
  module-includes-module record.
- A section, or an extension of RFC 0188's section, states that module `super`
  is inlined into each includer, tagged `@inlinedFrom`.
- The two passages that describe a `Module` instance are rewritten.
