---
title: "ActiveSupport::Gzip::Stream subclasses StringIO instead of hand-rolling a Buffer"
status: draft
updated: 2026-09-04
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 110
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::Gzip::Stream` is a `StringIO` subclass that forces BINARY on
construction and redefines `close` as `rewind`
(`vendor/rails/activesupport/lib/active_support/gzip.rb:18-23`):

```ruby
class Stream < StringIO
  def initialize(*)
    super
    set_encoding "BINARY"
  end
  def close; rewind; end
end
```

`packages/activesupport/src/gzip.ts:3-42` does not subclass anything. It
hand-rolls a `Buffer` and a `_position` cursor and re-implements `string`,
`buffer`, `write`, `rewind`, `close` and `read` against them, doing its own
`latin1` conversion in place of Ruby's `set_encoding "BINARY"`. That is ~40
lines of invented surface standing where Rails has a five-line subclass, and it
duplicates `packages/ruby-compat/src/string-io.ts`, which already ports
`StringIO` (`close`, `closed`, `isEof`, `read`, `rewind`, `size`, `string`,
`write`).

Surfaced while flipping `gzip.ts` onto the new `ZlibAdapter` seam in #7483
(`zlib-seam-is-the-last-static-node-builtin`). That PR deliberately changed only
`Gzip.compress` / `decompress` / `deflate` / `inflate` bodies and left `Stream`
alone — the seam was the scope, and this is a separate convergence.

`gzip.ts` scores `3 novel, 4 moved` on `pnpm parity:api:extra --package
activesupport` today, and those novel names are `Stream`'s.

## Converged shape

`class Stream extends StringIO` from `@blazetrails/ruby-compat`, with only the
two members Rails declares: a constructor that calls `super` then
`setEncoding(Encoding.ASCII_8BIT)` — Ruby's `"BINARY"` — and `close()` that is
`this.rewind()`. Every other member (`string`, `write`, `read`, `rewind`)
comes from the superclass and is deleted here.

Depends on `port-set-encoding-on-stringio-and-tempfile` (RFC 0129, PR #7474),
which is what puts `set_encoding` on `StringIO`.

## Acceptance criteria

- [ ] `Stream` in `packages/activesupport/src/gzip.ts` extends ruby-compat's
      `StringIO` and declares only `constructor` and `close`, mirroring
      `gzip.rb:18-23`.
- [ ] The hand-rolled `_buffer` / `_position` fields and the `string`, `buffer`,
      `write`, `rewind`, `read` members are deleted, not reimplemented.
- [ ] `pnpm parity:api:extra --package activesupport` reports fewer novel names
      on `gzip.ts` than the 3 it reports today; state before/after in the PR body
      (activesupport is ungated, so no gate will catch a regression).
- [ ] `pnpm vitest run packages/activesupport/src/gzip.test.ts` (5 tests) green.
