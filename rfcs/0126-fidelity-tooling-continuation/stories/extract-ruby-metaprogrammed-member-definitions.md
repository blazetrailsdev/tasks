---
title: "Teach the Ruby extractor Struct.new, define_method and literal-array class_eval"
status: ready
updated: 2026-08-28
rfc: "0126-fidelity-tooling-continuation"
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

## Correction and re-scope — 2026-08-17

**The premise as originally written is wrong and is withdrawn.** This body says
`extract-ruby-api.rb` "only sees members written as `def`". It does not, and has
not for some time — `grep -c define_method` returns **37**. The extractor already
carries `process_define_method_block` / `process_define_method` (`:1541`,
`:1547`) for literal-name `define_method`, `process_each_metaprogramming`
(`:1579`) which unrolls a **literal-array** `.each` loop metaprogramming
interpolated names, and `process_each_codegen` (`:1748`) for the
`CONST.each … class_eval "def #{name}…"` shape, plus `process_define_column_methods`,
`process_alias_method`, `process_delegate`, `process_scope`, `process_mattr` and
`process_attr`. Two RFC 0025 stories that predate all of that
(`ruby-extractor-records-define-method-names`,
`extractor-capture-define-method-loop-surface`) were closed as done in the same
sweep on this evidence.

The two gaps this story cites are still real — both re-measured 2026-08-17 —
but they are **narrower than the body claims**:

1. **`Struct.new`** — `locale/tag/rfc4646.ts` still reports 5 novel. No
   `Struct` handling exists in the extractor.
2. **Literal-array receiver for the `.each … class_eval` codegen** —
   `time-with-zone.ts` still reports 15 novel including `min`, `mon`, `msec`.
   `process_each_codegen` resolves a **constant** receiver via
   `resolve_const_symbol_array` but rejects a literal array, while
   `process_each_metaprogramming` handles a literal array but only for the
   `define_method` template, not `class_eval`. The two recorders each cover one
   axis of a 2x2 and the `%w(...).each { class_eval }` corner falls between them.

## Also absorbs `extractor-unrolls-const-driven-define-method-loops`

That story is the **fourth corner of the same 2x2**: a **constant** receiver
driving a `define_method` loop. Its own body diagnoses it exactly —
"`resolve_const_symbol_array` already resolves a symbol-array constant to its
members across files, and `process_each_codegen` already uses it — but only for
the `class_eval "def #{name}…"` template shape ... The `CONST.each { define_method … }`
combination falls between the two recorders." Closed into this story, since
fixing one corner without the other leaves the same seam.

The real shape of the work, then, is: make receiver kind (literal array vs
resolved constant) and template kind (`define_method` vs `class_eval`)
**independent** in one recorder, rather than two recorders each hard-wired to
one pair — plus `Struct.new` as a separate, smaller addition.

## Revised acceptance criteria

- All four receiver x template combinations are recorded by one code path:
  literal-array/`define_method` (works today), constant/`class_eval` (works
  today), literal-array/`class_eval` (gap), constant/`define_method` (gap).
- `Struct.new(*CONST)` / `Struct.new(:a, :b)` members are recorded as readers
  and `new` as a constructor.
- `pnpm parity:api:extra --package i18n` reports 0 novel for
  `locale/tag/rfc4646.ts`; `time-with-zone.ts`'s delegated readers stop
  appearing in the activesupport report and `parity:api`'s activesupport method
  count moves up.
- A `define_method` whose name source is neither a literal nor a resolvable
  constant stays novel — covered by a unit test.
- No package's novel count rises.
