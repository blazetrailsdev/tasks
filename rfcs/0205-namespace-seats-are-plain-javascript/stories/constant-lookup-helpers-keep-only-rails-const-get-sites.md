---
title: "String-keyed constant lookups become ES imports, or explicit registries where the name is computed"
status: ready
updated: 2026-10-28
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: conversion
packages:
  [
    "ruby-compat",
    "actionpack",
    "trailties",
    "activerecord",
    "activemodel",
    "activejob",
    "arel",
    "rack",
  ]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The repo owner wants constant **lookup** gone, not only constant definition
(2026-10-27). The sweep stories convert static namespace reads
(`Nodes.Not`) to imports. They do not cover the string-keyed lookup helpers,
which the README described as nine untouched sites. Measured on 2026-10-27, outside
test files:

- `rbModConstGet`: 38 uses in 17 files
- `rbModConstDefined`: 11 uses
- `rbModConstants`: 6 uses
- `rbConstGet`, `isRegisteredConstant`, `registeredConstant`,
  `rbPathToClass`, `reopened`, `rbFBinding`: 58 call sites outside
  `ruby-compat/src/variable.ts`, about half in ruby-compat itself
  (`include.ts`, `object.ts`, `marshal.ts`, `psych/`), the rest in et-orbi,
  thor, trailties generators, arel `select-manager.ts`, rack `builder.ts`

A lookup whose name is a string literal is a direct import in disguise, the
same rule CLAUDE.md § "A dispatch by name is spelled directly" applies to
`send`. Examples:

- `packages/ruby-compat/src/uri/rfc3986-parser.ts:139,180,187,199` and
  `uri/rfc2396-parser.ts:87,92,111,122,282` look up `"URI::InvalidURIError"`,
  `"URI"` and `"URI::Generic"` by name.

A lookup with a computed name stays only where the Rails body itself calls
`const_get` / `const_defined?` / `constants` / `constantize`, and it reads the
owner's own properties, not the global table:

- `ActionController::API.without_modules`
  (`vendor/rails/v8.0.2/actionpack/lib/action_controller/api.rb:107-113`),
  `packages/actionpack/src/action-controller/api.ts:75` and `base.ts:466`.
- `Logger.const_get(level.upcase)` in bootstrap,
  `packages/trailties/src/application/bootstrap.ts:75,81`.
- Adapter resolution (`packages/activerecord/src/connection-adapters.ts:76`),
  validator lookup (`packages/activemodel/src/validations/validates.ts:37`),
  queue adapters (`packages/activejob/src/queue-adapters.ts:17`), Chronic
  (`packages/chronic/src/handler.ts:91`, `repeater.ts:131`),
  `HelperMethods` (`packages/actionpack/src/abstract-controller/helpers.ts:201`).

Related backlog to read first, and to fold in where it overlaps:
`0154/constantize-open-codes-rb-mod-const-get`,
`0154/rb-mod-const-get-rejects-non-constant-names-and-walks-ancestors`,
`0154/rb-path-to-class-reads-seated-path-whole-over-flat-constant-table`.

## Acceptance criteria

- [ ] No call to a lookup helper above passes a string-literal name; each is
      a plain ES import (a deferred read) or an `import type`.
- [ ] No call to a lookup helper above remains with a computed name. Each
      becomes an explicit registry read: a generated class-path table, the
      application table from `application-classes-resolve-without-a-registration-call`,
      or a module-private map beside the reader for a closed set (queue
      adapters, Marshal's `path2class`, MessagePack's `load_class`). It cites
      the Rails `file:line` whose `const_get` / `constantize` it replaces.
      No ported `const_get` walk answers it (owner ruling, 2026-10-28).
- [ ] The built `dist/**.js` of each touched package loads as a plain-node
      ESM entry module (CLAUDE.md § "Call-time constant resolution").
- [ ] Touched test files pass.
