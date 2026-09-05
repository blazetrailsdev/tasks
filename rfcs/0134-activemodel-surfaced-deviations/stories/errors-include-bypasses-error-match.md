---
title: "activemodel: Errors#include? compares the attribute directly instead of delegating to Error#match?"
status: in-progress
updated: 2026-09-05
rfc: "0134-activemodel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: 7508
claim: "2026-09-05T03:22:11Z"
assignee: "errors-include-bypasses-error-match"
blocked-by: null
closed-reason: null
---

# `Errors#include?` compares the attribute directly instead of delegating to `Error#match?`

## Context

Spotted while converging `where` in PR #7396
(`errors-where-invented-branch-and-merge-bang-return`).

Rails (`vendor/rails/activemodel/lib/active_model/errors.rb:196-201`):

```ruby
def include?(attribute)
  @errors.any? { |error|
    error.match?(attribute.to_sym)
  }
end
alias :has_key? :include?
alias :key? :include?
```

`packages/activemodel/src/errors.ts`'s `include` is:

```ts
include(attribute: string): boolean {
  return this._errors.some((e) => e.attribute === attribute);
}
```

The delegation to `Error#match?` (`activemodel/lib/active_model/error.rb:166-178`)
is dropped in favour of an inlined field comparison. Behaviour agrees today —
`match?` with a nil `type` and no options reduces to exactly that comparison —
but it is the dropped-delegation class CLAUDE.md names as the
highest-frequency fidelity miss in the repo, and it silently stops tracking
`match?` if that body ever grows an arm (it already carries the options loop
at error.rb:171-175).

## Converged shape

`return this._errors.some((e) => e.match(attribute));` — the same one-line body
Rails has, with `hasKey` / `isKey` continuing to delegate to it as Ruby's two
aliases do.

## Acceptance criteria

- `include` calls `Error#match` rather than reading `error.attribute`.
- `pnpm parity:api:calls` shows no new row for errors.ts (this should REMOVE a
  miss, not add one).
- Existing `errors.test.ts` `include?` / `key?` / `no key` coverage stays green.
