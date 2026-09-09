---
title: "Journey's parseTerminal default arm and Node#type base getter raise where Rails does not"
status: in-progress
updated: 2026-09-09
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: 63
pr: 7641
claim: "2026-09-09T13:02:34Z"
assignee: "journey-uri-encoder-class-shape"
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

**2. `Terminal#type`'s getter**
(`packages/actionpack/src/action-dispatch/journey/nodes/node.ts:88`):

```ts
get type(): NodeType {
  throw new Error("subclass must override type");
}
```

CORRECTION (2026-09-09, while implementing): the paragraph that stood here said
Rails' `Nodes::Node` "has no `type` at all ... no base declaration and no
raise". That is false. `vendor/rails/actionpack/lib/action_dispatch/journey/
nodes/node.rb:98-100` is:

```ruby
def type
  raise NotImplementedError
end
```

`Nodes::Terminal` (`node.rb:111-114`) then declares no `type` of its own and
inherits that raise; each concrete node (`Literal`, `Slash`, `Dot`, `Symbol`,
`Star`, `Cat`, `Or`, `Group`) overrides it with its own symbol.

So the invented member is not the raise itself but its HOST: trails put a
throwing `type` on `Terminal`, where Rails declares none, shadowing the base.
trails' `Node` already carries `abstract get type(): NodeType`, which is the TS
convergence of Rails' raise-only base declaration — a member that exists solely
to be overridden, enforced at compile time instead of at call time. The fix is
therefore to delete `Terminal`'s getter and let the abstract base member stand,
not to add a raise anywhere.

The `NodeType` string union (`"LITERAL" | "SLASH" | ... | "OR"`) is still a
trails addition; Rails dispatches on the class, which is why `gtg/builder.rb:83`
interpolates `node.class.name`.

`journey-arm-and-short-circuit-triage` in this RFC covers the arm-multiset
triage broadly; these two are called out separately because the fix is a
deletion, not a re-arming.

## Converged shape

- `parseTerminal` returns `nil`/`undefined` for an unmatched token the way
  Ruby's `case` does, with the caller's contract adjusted to match Rails'
  (which likewise carries the `nil` onward).
- `Terminal#type`'s getter is deleted, leaving `Node`'s existing
  `abstract get type(): NodeType` as the mirror of Rails' raising base
  declaration (`node.rb:98-100`). `Terminal` becomes `abstract` in turn, since
  it declares no `type` of its own — as `node.rb:111-114` does not.

## Acceptance criteria

- [ ] Neither invented raise remains.
- [ ] `parseTerminal`'s unmatched-token behaviour matches
      `parser.rb:88-96` — verify against MRI (`ruby` is on PATH) rather than
      deriving it.
- [ ] `pnpm parity:api:arms:report`'s actiondispatch invented-`throw` count
      drops by 1; `pnpm parity:api:arms:throws` stays green.

      AMENDED (2026-09-09): this AC said "drops by 2", one per raise. Measured
      against the artifact — `journey/parser.ts` and `journey/nodes/node.ts`
      swapped to their `origin/main` versions, `API_COMPARE_FORCE=1 pnpm
      parity:api --calls`, then counting `throw:`/`raise:` tokens per compared
      pair — actiondispatch's invented-`throw` total is 34 before and 33 after.
      Only `parseTerminal` is a compared pair carrying the token; the `type`
      getters are not in the skeleton population at all, so deleting
      `Terminal#type` is real convergence that this measure cannot see. Note
      also that `pnpm parity:api:arms:throws` gates MISSING throws, not invented
      ones, so neither deletion moves `arm-throw-mark.json`.

- [ ] The Journey suites stay green.
