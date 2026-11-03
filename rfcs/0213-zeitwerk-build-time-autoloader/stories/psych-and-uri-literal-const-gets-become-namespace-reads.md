---
title: "Psych and URI literal constGet reads become namespace reads"
status: claimed
updated: 2026-11-03
rfc: "0213-zeitwerk-build-time-autoloader"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-11-03T22:58:13Z"
assignee: "psych-and-uri-literal-const-gets-become-namespace-reads"
blocked-by: null
closed-reason: null
---

## Context

trails#9681 replaced flat `registeredConstant("A::B")` reads with `constGet(Object, "<literal>")` at call time. The literal sites are:

- `packages/ruby-compat/src/psych/nodes/node.ts` (`each`, `toRuby`, `yaml`): `Psych::Visitors::DepthFirst`, `ToRuby` and `Emitter`;
- `uri/rfc2396-parser.ts` and `uri/rfc3986-parser.ts`: `URI::InvalidURIError` and `URI::Generic`.

They avoid a plain import because the import edge re-orders evaluation (`node.ts` → visitors → `scalar.ts`, whose `class Scalar extends Node` is then in TDZ) or closes the `uri/common.ts` ↔ parser cycle the import-cycles gate checks. Root CLAUDE.md § "Constant lookup is an import or a registry" says a name that is a literal at the call site is an import or a namespace read, not a lookup.

Ruby: `node.rb:21` calls `Visitors::DepthFirst.new(block)`, `node.rb:50` calls `Visitors::ToRuby.create`, and `node.rb:61` calls `Visitors::Emitter.new` (`vendor/ruby/v3.3.11/ext/psych/lib/psych/nodes/node.rb`). `rfc3986_parser.rb:166` reads `URI::Generic`, all as plain constant reads.

## Acceptance criteria

- Each site reads a namespace at call time instead: `Psych.Visitors.X` through a type-only import of `psych.ts`'s `Psych` namespace seated on `TopLevel`, and `URI.InvalidURIError` / `URI.Generic`. No literal `constGet(Object, …)` remains in `packages/ruby-compat/src/psych/` or `src/uri/`.
- `import-cycles` and a plain-node import of `dist/psych/nodes/node.js` and `dist/uri/rfc3986-parser.js` as entry modules both pass.
