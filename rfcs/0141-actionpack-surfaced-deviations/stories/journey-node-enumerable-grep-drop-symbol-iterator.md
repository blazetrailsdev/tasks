---
title: "Journey::Nodes::Node: port Enumerable#grep, use find_all/each, drop [Symbol.iterator]"
status: draft
updated: 2026-09-29
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
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

`Journey::Nodes::Node` does `include Enumerable` over its `each`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/journey/nodes/node.rb:70,79`).
trails#8241 applied `include(Node, Enumerable)` and ported `find_all` for
`Pattern#optional_names` (`journey/path/pattern.rb:62-66`), but
`packages/actionpack/src/action-dispatch/journey/nodes/node.ts` still has:

- `[Symbol.iterator]` (a `@noRailsEquivalent PERMANENT` delegate to `each`), and
- a hand-written `grep(klass)` using `instanceof` over that iterator. Rails has no
  `Node#grep`. It is `Enumerable#grep` (`vendor/ruby/v3.3.11/enum.c` `enum_grep`, `pattern === elem`),
  which Rails' own tests call as `ast.root.grep(Nodes::Symbol)`
  (`actionpack/test/journey/nodes/ast_test.rb:17,31`, `route_test.rb:27`).

The remaining iterator consumers diverge from Rails' calls:

- `Pattern#offsets` spreads `[...this.spec].filter((n) => n.isSymbol())`, where Rails has
  `spec.find_all(&:symbol?).each do |node|` (`journey/path/pattern.rb:192`).
- `GTG::Builder#buildFollowpos` does `for (const n of this.ast)`, where Rails has
  `@ast.each do |n|` (`journey/gtg/builder.rb:132`).

## Acceptance criteria

- Port `Enumerable#grep` into ruby-compat's `Enumerable` (`enum_grep`, `===` via
  `instanceof` for a class pattern), with its `@noRailsEquivalent PERMANENT` receipt.
  Delete `Node#grep`, and add `declare grep` beside `declare findAll`.
- `offsets` reads `this.spec.findAll((n) => n.isSymbol()).forEach(...)`, and `buildFollowpos`
  reads `this.ast.each(...)`.
- `Node[Symbol.iterator]` and its receipt are deleted. `ast.test.ts` and `route.test.ts`
  keep passing through `Enumerable#grep`.
