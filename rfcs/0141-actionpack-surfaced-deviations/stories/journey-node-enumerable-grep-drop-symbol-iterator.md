---
title: "Journey: offsets and build_followpos iterate a Node through Symbol.iterator, not find_all / each"
status: ready
updated: 2026-10-19
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
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
trails#8241 applied `include(Node, Enumerable)`, and the hand-written `Node#grep`
has since gone. What remains in
`packages/actionpack/src/action-dispatch/journey/nodes/node.ts` is
`[Symbol.iterator]` (`:16`), a `@noRailsEquivalent PERMANENT` delegate to `each`, and
two consumers that iterate through it where Rails calls Enumerable:

- `Pattern#offsets` spreads `[...this.spec].filter((n) => n.isSymbol())`
  (`journey/path/pattern.ts:276`), where Rails has `spec.find_all(&:symbol?).each do |node|`
  (`journey/path/pattern.rb:192`).
- `GTG::Builder#buildFollowpos` does `for (const n of this.ast)` (`journey/gtg/builder.ts:173`),
  where Rails has `@ast.each do |n|` (`journey/gtg/builder.rb:132`).

## Acceptance criteria

- `offsets` reads `this.spec.findAll((n) => n.isSymbol()).each(...)`, and `buildFollowpos`
  reads `this.ast.each(...)`.
- `Node[Symbol.iterator]` and its receipt are deleted if nothing else iterates a node with
  `for…of` / spread; otherwise each remaining consumer is converged the same way.
- The journey test files pass.
