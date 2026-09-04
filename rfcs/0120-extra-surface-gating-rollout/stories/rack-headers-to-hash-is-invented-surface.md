---
title: "Rack::Headers#toHash is invented surface; Hash#to_hash belongs on ruby-compat's Hash"
status: draft
updated: 2026-09-04
rfc: "0120-extra-surface-gating-rollout"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rack::Headers` (`vendor/rack/lib/rack/headers.rb:8`) is `class Headers < Hash`
and defines **neither `to_h` nor `to_hash`** — verified with
`grep -n "def to_hash\|def to_h\b" vendor/rack/lib/rack/headers.rb`, which
matches nothing. Both are inherited from `Hash`, and rack's own spec asserts
the inherited behaviour: `spec_headers.rb:406-408` (`to_h`) and
`spec_headers.rb:323-325` (`to_hash`) both expect a plain
`Hash['3','4','ab','1','cd','2']`.

PR #7485 deleted `Headers#toH` on exactly this evidence and let it inherit
ruby-compat's new `Hash#toH`. Its twin, `Headers#toHash`, is still there
(`packages/rack/src/headers.ts:94`):

```ts
toHash(): Record<string, string> {
  ...
}
```

— invented surface with an invented return type. Ruby's `Hash#to_hash`
(`vendor/ruby/hash.c` `rb_hash_to_hash`) returns **self**, a Hash; the trails
override returns a plain JS `Record`, which is why `headers.test.ts`'s
`to hash` test asserts `toEqual({})` where rack's spec asserts a `Hash`. Two
in-repo callers depend on the `Record` shape
(`packages/rack/src/headers.ts:364-365`, inside `merge`/`update`).

Same class of finding as the `toH` deletion, left out of #7485 to keep that PR
to its claimed stories.

## Converged shape

- Port `Hash#toHash` onto `packages/ruby-compat/src/hash.ts` as
  `rb_hash_to_hash`: the receiver itself, an MRI citation, and a
  `@noRailsEquivalent PERMANENT` receipt beside its `toH` neighbour.
- Delete `Headers#toHash` and let it inherit, the way `Headers#toH` now does.
- Repoint `headers.ts:364-365`'s `merge`/`update` readers off the `Record`
  shape onto the `Hash` the inherited method returns.
- `headers.test.ts`'s `to hash` keeps its name and takes rack's own
  assertions (`spec_headers.rb:323-325`), the way `to h` did.

## Acceptance criteria

- `toHash` is declared on ruby-compat's `Hash` with an MRI citation, and
  `Rack::Headers#toHash` is gone.
- `pnpm typecheck` clean; the rack suite passes with `to hash` renamed nothing.
- `pnpm parity:api:extra` for rack does not grow.
