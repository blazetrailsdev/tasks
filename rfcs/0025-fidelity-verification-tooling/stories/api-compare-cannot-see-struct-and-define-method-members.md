---
title: "parity:api reports a faithful port of a Struct or define_method member as novel surface"
status: closed
updated: 2026-08-17
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Superseded by extract-ruby-metaprogrammed-member-definitions (2026-08-17 sweep): merged with api-compare-literal-array-class-eval-codegen — both are the Ruby extractor only seeing 'def'. rfc4646.ts re-measured at 5 novel; citations carried forward."
---

## Context

`parity:api:extra` reports a member as novel when the Ruby extractor found no
counterpart, but the extractor only sees members written as `def`. A member
installed by `Struct.new` or by `define_method` is invisible to it, so a
faithful port of one is reported as invented surface.

Concrete instance, from PR #6178's port of `i18n/lib/i18n/locale/tag/rfc4646.rb`:

```ruby
class Rfc4646 < Struct.new(*RFC4646_SUBTAGS)   # rfc4646.rb:16
  RFC4646_FORMATS.each do |name, format|       # rfc4646.rb:32-34
    define_method(name) { self[name].send(format) unless self[name].nil? }
  end
```

`pnpm parity:api:extra --package i18n` reports five of the seven readers as novel —
`extension`, `grandfathered`, `privateuse`, `region`, `variant` — plus
`constructor` for `Struct`'s `new`. All six have a real Ruby counterpart; the
extractor has no way to name it. The port carries the trace in `#subtag`'s
JSDoc, which is the only receipt available today.

`@noRailsEquivalent` is the wrong tool: it would assert there is no Ruby
counterpart, which is false, and it is the tag reviewers read as "known extra
surface, not yet removed".

## Converged shape

The Ruby extractor learns the two metaprogramming shapes that install a plain
reader:

- `X < Struct.new(*CONST)` / `Struct.new(:a, :b)` — each member name is a
  reader, and `new` is a constructor.
- `define_method(name)` where `name` is the block parameter of an `each` over a
  literal Hash or Array constant in the same file — the constant's keys are the
  method names.

Both are lexically resolvable without executing Ruby, which is the constraint
the extractor already works under. Anything it cannot resolve stays novel, as
today.

## Acceptance criteria

- [ ] `pnpm parity:api:extra --package i18n` reports 0 novel for
      `locale/tag/rfc4646.ts`.
- [ ] `scripts/api-compare` unit tests cover both shapes, including a
      `define_method` whose name source is NOT a literal constant (still novel).
- [ ] No package's novel count rises.
