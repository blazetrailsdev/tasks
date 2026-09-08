---
title: "ruby-array-join-recurses-into-nested-elements-js-does-not"
status: draft
updated: 2026-09-08
rfc: "0082-ruby-ts-idiom-conversion-classes"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Ruby's `Array#join(sep)` **recurses into a nested element with the same
separator**. JS's `Array.prototype.join` does not: it falls back to the
element's `toString()`, which is a comma-joined string. Verified against MRI:

```sh
ruby -e 'p [["a","b"], "c"].join("-")'            # "a-b-c"
ruby -e 'p [["a",["b","c"]]].join("-")'           # "a-b-c"
node -e 'console.log([["a","b"],"c"].join("-"))'  # a,b-c
```

So `ary.join(sep)` ports as `ary.flat(Infinity).join(sep)`, not as
`ary.join(sep)`, wherever an element can itself be an array. The two spellings
are identical for a flat array, which is why the divergence is silent — it only
appears on the nested input, and it corrupts the separator rather than raising.

Found in `ActionView::Digestor#dependency_digest`
(`vendor/rails/actionview/lib/action_view/digestor.rb:97-107`), fixed in PR
7628. `Digestor.digest` pushes each element of `dependencies` into an
`Injected` node **unflattened** (`digestor.rb:31-33`) and `Injected#digest`
returns `name` itself (`digestor.rb:125-127`), so a nested dependency reached
the join and two distinct dependency sets could collide on the comma spelling.
`packages/actionview/src/template/digestor.trails.test.ts` pins it.

This is a general Ruby→TS conversion class, not an actionview fact: any ported
body doing `something.join(sep)` over a collection whose elements are not
provably scalars has the same latent bug.

## Acceptance criteria

- [ ] Sweep ported bodies for `.join(` where the receiver can hold an array
      element, using the Ruby side as the oracle (the Ruby body's receiver is
      built from `map`/`collect` over values that may be arrays, or from a
      caller-supplied array).
- [ ] Each real instance converges to `.flat(Infinity).join(sep)`; each
      provably-scalar receiver is left alone (no blanket rewrite — `flat` on a
      hot path that cannot nest is noise).
- [ ] Add the class to `docs/ruby-ts-conventions.md`'s idiom traps, or to
      CLAUDE.md's "Ruby idioms that do not translate literally" list, so the
      next port does not re-derive it.
- [ ] A test pins at least one converged instance on the nested input.
