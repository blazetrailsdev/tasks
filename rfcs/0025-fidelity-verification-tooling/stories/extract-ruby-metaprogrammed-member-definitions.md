---
title: "Teach the Ruby extractor Struct.new, define_method and literal-array class_eval"
status: draft
updated: 2026-08-17
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: ["activesupport"]
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Combines two RFC 0025 drafts with one root cause (swept 2026-08-17).

`scripts/api-compare/extract-ruby-api.rb` only sees members written as `def`.
Rails installs plenty of real methods by metaprogramming, and every faithful
port of one is reported as invented surface by `parity:api:extra` and scored
short by `parity:api`.

### `Struct.new` and `define_method`

From PR #6178's port of `i18n/lib/i18n/locale/tag/rfc4646.rb`:

```ruby
class Rfc4646 < Struct.new(*RFC4646_SUBTAGS)   # rfc4646.rb:16
  RFC4646_FORMATS.each do |name, format|       # rfc4646.rb:32-34
    define_method(name) { self[name].send(format) unless self[name].nil? }
  end
```

Re-measured 2026-08-17: `pnpm parity:api:extra --package i18n` reports
`locale/tag/rfc4646.ts` at **5 novel** — `extension`, `grandfathered`,
`privateuse`, `region`, `variant` — every one with a real Ruby counterpart the
extractor has no way to name. The port carries the trace in `#subtag`'s JSDoc,
which is the only receipt available today.

### Literal-array `.each … class_eval` codegen

`process_each_codegen` recognizes the CONSTANT receiver form
(`CONST.each do |x| … class_eval "def #{x}…"`, as in `query_methods.rb`'s
`VALUE_METHODS` loop) but not the **literal-array** receiver:

```ruby
%w(year mon month day mday wday yday hour min sec usec nsec to_date).each do |method_name|
```

at `vendor/rails/activesupport/lib/active_support/time_with_zone.rb:440-448`.
Re-measured 2026-08-17: `time-with-zone.ts` reports **15 novel**, including
`min`, `mon`, `msec`, `wday`, `yday` — each a real `TimeWithZone` method — and
`parity:api` scores the file short by the same members.

## Converged shape

The extractor learns the shapes that install a plain reader, all lexically
resolvable without executing Ruby (the constraint it already works under):

- `X < Struct.new(*CONST)` / `Struct.new(:a, :b)` — each member name is a
  reader; `new` is a constructor.
- `define_method(name)` where `name` is the block parameter of an `each` over a
  literal Hash or Array constant in the same file — the constant's keys are the
  method names.
- `.each … class_eval` with a **literal array** receiver, the way it already
  handles a constant receiver.

Anything it cannot resolve stays novel, as today.

## Acceptance criteria

- `pnpm parity:api:extra --package i18n` reports 0 novel for
  `locale/tag/rfc4646.ts`.
- `TimeWithZone`'s delegated readers stop appearing in
  `pnpm parity:api:extra --package activesupport`, and the activesupport
  `parity:api` method count moves up accordingly.
- `scripts/api-compare` unit tests cover all three shapes, including a
  `define_method` whose name source is NOT a literal constant (still novel).
- No package's novel count rises.
