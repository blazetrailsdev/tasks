---
title: "Tool::<Name> deprecated constants warn on read (tool.rb deprecate_constant)"
status: in-progress
updated: 2026-10-27
rfc: "0203-mini-magick-port-to-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9381
claim: "2026-10-27T17:18:37Z"
assignee: "ruby-compat-move-time-from-date"
blocked-by: null
closed-reason: null
---

## Context

`tool.rb` (mini_magick 5.2.0, the `%w[animate … stream].each` block at the end of `class Tool`) does `const_set(tool.capitalize, Class.new(self) { … })` and then `deprecate_constant(tool.capitalize)`, so reading `MiniMagick::Tool::Convert` warns through `rb_const_warn_if_deprecated` (`vendor/ruby/v3.3.11/variable.c:3104-3117`).

trails#9262, following the owner's ruling (no `namespaces.ts` / `rbModConstSet`), writes each subclass as a plain property of `Tool` (`packages/mini-magick/src/tool.ts`, the loop at the end of the file) and calls `rbModDeprecateConstant(Tool, name)`. A plain property read does not go through ruby-compat's constant lookup, so `Tool.Convert` never warns. The deprecation is recorded but never observed.

## Acceptance criteria

- Reading `Tool.Convert` (and each of the twelve names) emits the `:deprecated`-category warning `rb_const_warn_if_deprecated` emits ("constant MiniMagick::Tool::Convert is deprecated"), without reintroducing `rbModConstSet` or a namespace seat. For example, the constant is a static getter on `Tool` that warns and then answers the class.
- A spec or ruby-compat-backed test asserts the warning.
