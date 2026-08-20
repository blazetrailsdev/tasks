---
title: "Converge errors.ts's collection facade onto Rails' Enumerable delegation"
status: done
updated: 2026-08-20
rfc: "0115-activemodel-fidelity-convergence"
cluster: "api-compare"
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6786
claim: "2026-08-20T19:20:08Z"
assignee: "converge-errors-enumerable-delegation-onto-rails"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activemodel/lib/active_model/errors.rb` gets its collection
surface by `include Enumerable` plus one delegation line:

```ruby
delegate :each, :clear, :empty?, :size, :uniq!, to: :@errors
```

`packages/activemodel/src/errors.ts` hand-writes eleven of them —
`get` (`:179`), `on` (`:389`), `count` (`:393`), `size` (`:397`), `any`
(`:401`), `empty` (`:405`), `clear` (`:409`), `uniqBang` (`:419`), `each`
(`:431`), `toArray` (`:466`) — plus `mapWithDefault` (`:27`, 14 code lines), a
module-level `Hash.new { |h,k| h[k] = [] }` stand-in. 54 code lines with no
Rails counterpart, and `pnpm parity:api:extra --package activemodel` scores the
file **0 novel / 10 moved** — the largest pure-moved count in the package after
`model.ts`, i.e. every one of these names exists in Rails, just not in
`errors.rb`.

`get` and `on` are the interesting pair: Rails **removed** `Errors#get` and
`Errors#on` in Rails 6.1 (`errors.rb` has neither). They are `moved` only
because the names occur elsewhere in the Ruby tree. Check before deleting —
if a trails caller depends on them, converge the caller onto `messages_for` /
`where`, which `errors.ts` already has (`:334`, `:127`).

`mapWithDefault` should be whatever the repo's settled spelling for Ruby's
default-block Hash is; grep for a prior instance before inventing a second.

## Acceptance criteria

- The collection facade is a delegation to the underlying `@errors` array, as
  `errors.rb:56-63` has it, not eleven hand-written methods.
- `get` and `on` are deleted, with callers converged onto `messagesFor` /
  `where`.
- `mapWithDefault` is deleted or moved to the repo's existing
  default-block-Hash helper.
- `pnpm parity:api:extra --package activemodel` shows `errors.ts` at 0 novel /
  ≤ 2 moved.
- `activemodel/errors.json`'s 3 baseline rows shrink or hold; converged rows
  hand-deleted then tightened.
- Parity deltas non-negative for activemodel **and** activerecord.

## Verification

```bash
pnpm vitest run packages/activemodel/src/errors.test.ts packages/activemodel/src/error.test.ts packages/activemodel/src/nested-error.test.ts
```
