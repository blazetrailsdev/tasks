---
title: "Journey Node#grep is hand-written; take it from ruby-compat Enumerable#grep"
status: draft
updated: 2026-11-06
rfc: "0141-actionpack-surfaced-deviations"
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

`Journey::Nodes::Node` gets `grep` from `include Enumerable`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/journey/nodes/node.rb:70`).
trails applies `include(Node, Enumerable)`
(`packages/actionpack/src/action-dispatch/journey/nodes/node.ts`), but
ruby-compat's `Enumerable` (`packages/ruby-compat/src/enumerable.ts`) has no
`grep`, so `node.ts` still defines its own `Node#grep(klass)` over `each`.
Callers: `route.test.ts:40` and `nodes/ast.test.ts:13,23` (`grep(Terminal)`,
`grep(SymbolNode)`).

MRI `enum_grep` (`vendor/ruby/v3.3.11/enum.c`) selects the elements for which
`pattern === elem` holds, and maps them through the block when one is given.

## Acceptance criteria

- ruby-compat `Enumerable#grep(pattern, block?)` uses `===` semantics
  (a class → `instanceof`, a RegExp → `test` on the string, otherwise `rbEqual`).
- The hand-written `Node#grep` is deleted. `Node` exposes it through a
  `declare grep` from the include, and the journey tests pass.
