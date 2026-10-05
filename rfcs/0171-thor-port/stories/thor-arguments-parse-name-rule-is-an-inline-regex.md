---
title: "Thor::Arguments#parse builds parse_#{type}'s TS name with an inline regex instead of ruby-compat's method-name rule"
status: draft
updated: 2026-10-05
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Reviewer nit on trails#8544. `Thor::Arguments#parse`
(`vendor/thor/v1.3.2/lib/thor/parser/arguments.rb:46`) is
`send(:"parse_#{argument.type}", argument.human_name)`. The port
(`packages/trailties/src/thor/parser/arguments.ts`, `parse`) builds the TS method name by
applying the repo's method-name rule (`snake_case` to `camelCase`,
`docs/ruby-ts-conventions.md`) inline:
`` `parse_${argument.type}`.replace(/_([a-zA-Z\d])/g, (_, c) => c.toUpperCase()) ``.

ruby-compat already has that exact rule as the module-private `camelized`
(`packages/ruby-compat/src/object.ts:495`), which `sendInternal` uses for a `?` name and
`writerSpelling` for a writer. `rbFSend` does not apply it to an ordinary name, so
`rbFSend(obj, "parse_foo_bar")` raises `NoMethodError`. activesupport's `camelize` is outside
what `eslint/thor-import-boundary.mjs` lets the thor port import.

## Acceptance criteria

- [ ] A Ruby method name reaches its TS spelling through one ruby-compat rule: either
      `rbFSend` resolves a snake_case `mid` (without rewriting a leading-underscore name), or
      the rule is exported with its receipt.
- [ ] `Arguments#parse` sends `parse_#{type}` through it, with no regex in `arguments.ts`.
- [ ] `arguments.trails.test.ts`'s "sends parse\_ for an underscored type" stays green.
