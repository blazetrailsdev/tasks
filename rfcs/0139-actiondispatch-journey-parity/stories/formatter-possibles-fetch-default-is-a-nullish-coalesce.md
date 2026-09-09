---
title: "Formatter#possibles reads :___routes with ?? where Rails uses fetch-with-block"
status: draft
updated: 2026-09-09
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Formatter#possibles` reads its route bucket with Ruby's block-default `fetch`
(`vendor/rails/actionpack/lib/action_dispatch/journey/formatter.rb:206-212`):

```ruby
def possibles(cache, options, depth = 0)
  cache.fetch(:___routes) { [] } + options.find_all { |pair|
    cache.key?(pair)
  }.flat_map { |pair|
    possibles(cache[pair], options, depth + 1)
  }
end
```

trails (`packages/actionpack/src/action-dispatch/journey/formatter.ts`) ports
that first term as a nullish coalesce:

```ts
...((cache["___routes"] as [number, Route][]) ?? []),
```

The two differ exactly where CLAUDE.md's "fetch vs `??`" idiom class says they
do. `h.fetch(:k) { default }` runs the block only when the key is ABSENT, so a
stored `nil` or `false` comes back as itself; `x ?? default` substitutes the
default for `null`/`undefined` whichever way the key got there. Today the port
is not observably wrong, because the only writer is `build_cache`
(`formatter.rb:214-223`), which stores an array at `:___routes` and never a
nil — but the guard is load-bearing the moment anything else writes that slot,
and it is the reason `pnpm parity:api:arms:report --package=actiondispatch`
carries an invented `or` row on `journey/formatter.ts#possibles` where Rails'
skeleton has no arm at all.

Filed from PR #7641, which converged `possibles` to Rails' shape in every other
respect — the `find_all` / `flat_map` chain, the `key?` guard, and the
`depth = 0` third parameter threaded through the recursive call — and left this
one term as the residue.

## Converged shape

Read the slot the way Ruby's `fetch`-with-block reads it: present-key test
first, default only on absence, so a stored falsy value survives. That is an
`Object.hasOwn` test rather than `??`, and it retires the invented `or` arm
because the resulting skeleton carries no short-circuit token — matching
`formatter.rb:206`, whose `fetch` is a plain call.

Do not reach for a shared helper: `nonRecursive` (`formatter.rb:169-183`)
already spells this same test inline as `Object.hasOwn(c, "___routes")`, twice,
because Rails spells it inline as `c.key?(:___routes)`. One Rails method is one
TS method, and Rails extracts nothing here.

## Acceptance criteria

- [ ] `possibles`' `:___routes` read distinguishes an absent key from a stored
      falsy value, matching `Hash#fetch` with a block (`formatter.rb:206`).
- [ ] `pnpm parity:api:arms:report --package=actiondispatch` no longer lists an
      invented `or` for `journey/formatter.ts#possibles`.
- [ ] `pnpm parity:api --package actiondispatch` holds `journey/formatter.rb` at
      100% with no arity or param-name regression; `pnpm parity:api:calls`,
      `:calls:args` and `:extra:gate` stay green.
- [ ] No new helper or exported name; `pnpm parity:api:extra --package
actiondispatch` still lists no `journey/formatter.ts`.
- [ ] `pnpm vitest run packages/actionpack/src/action-dispatch/journey` passes.
