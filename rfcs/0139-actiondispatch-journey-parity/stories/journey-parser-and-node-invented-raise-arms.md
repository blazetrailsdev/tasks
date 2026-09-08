---
title: "Journey's parseTerminal default arm and Node#type base getter raise where Rails does not"
status: draft
updated: 2026-09-08
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `Parser#parse_group`'s raise class in PR #7606
(`vendor/rails/actionpack/lib/action_dispatch/journey/parser.rb:82`). Two
neighbouring raise sites in the same subsystem have no Rails counterpart at
all — they are invented arms, so no raise-class fix applies; they should not
raise.

**1. `parseTerminal`'s `default` arm**
(`packages/actionpack/src/action-dispatch/journey/parser.ts:108`):

```ts
default:
  throw new Error(`unexpected token: ${this._nextToken}`);
```

Rails' `parse_terminal` is a bare `case` with `when :SYMBOL / :LITERAL / :SLASH
/ :DOT` and **no `else`**
(`vendor/rails/actionpack/lib/action_dispatch/journey/parser.rb:88-96`), so an
unmatched token yields `nil` and `advance_token; node` returns `nil`. The port
turns a `nil` return into a raise, which is a control-flow divergence, not just
a class one — RFC 0113's arms axis, not RFC 0111's.

**2. `Node#type`'s base getter**
(`packages/actionpack/src/action-dispatch/journey/nodes/node.ts:88`):

```ts
get type(): NodeType {
  throw new Error("subclass must override type");
}
```

Rails' `Nodes::Node` has no `type` at all — each concrete node defines its own
`type` (`nodes/node.rb`), and there is no base declaration and no raise. The
whole `NodeType` string union (`"LITERAL" | "SLASH" | ... | "OR"`) is a trails
addition; Rails dispatches on the class, which is why `gtg/builder.rb:83`
interpolates `node.class.name`.

`journey-arm-and-short-circuit-triage` in this RFC covers the arm-multiset
triage broadly; these two are called out separately because the fix is a
deletion, not a re-arming.

## Converged shape

- `parseTerminal` returns `nil`/`undefined` for an unmatched token the way
  Ruby's `case` does, with the caller's contract adjusted to match Rails'
  (which likewise carries the `nil` onward).
- `Node#type`'s base getter is deleted; if TS needs the member declared, make
  it `abstract` with no body rather than a throwing default.

## Acceptance criteria

- [ ] Neither invented raise remains.
- [ ] `parseTerminal`'s unmatched-token behaviour matches
      `parser.rb:88-96` — verify against MRI (`ruby` is on PATH) rather than
      deriving it.
- [ ] `pnpm parity:api:arms:report`'s actiondispatch invented-`throw` count
      drops by 2; `pnpm parity:api:arms:throws` stays green.
- [ ] The Journey suites stay green.
