---
title: "Kernel.Float belongs to ruby-compat and raises like MRI, not returns undefined"
status: draft
updated: 2026-08-31
rfc: "0129-ruby-compat"
cluster: fidelity
packages:
  - "ruby-compat"
  - "activesupport"
  - "activemodel"
  - "activerecord"
deps: []
deps-rfc: []
est-loc: 260
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`kernelFloat` (`packages/activesupport/src/core-ext/big-decimal/conversions.ts:491`)
is a port of Ruby's `Kernel#Float`, and its own JSDoc says so in the exact terms
that define this RFC's population:

```
@noRailsEquivalent PERMANENT — Ruby core (Kernel.Float), which Rails calls
without defining, so there is no Ruby file in any gem for the port to mirror.
```

It is a Ruby core primitive hand-rolled where a port first needed it, living in
`activesupport` because that is where the first caller was. `Kernel#Rational`
is already in `RUBY_COMPAT_EXPORTS` (`scripts/parity/ruby-compat.ts:49`);
`Kernel#Float` is its sibling and is in neither the table nor any story.

### The divergence: MRI raises where trails returns `undefined`

Verified on MRI 3.3 (`ruby -e 'Float(x)'`):

| input     | MRI             | trails `kernelFloat` |
| --------- | --------------- | -------------------- |
| `"abc"`   | `ArgumentError` | `undefined`          |
| `""`      | `ArgumentError` | `undefined`          |
| `"0b1"`   | `ArgumentError` | `undefined`          |
| `nil`     | `TypeError`     | `undefined`          |
| `[]`      | `TypeError`     | `undefined`          |
| `Object.new` (no `to_f`) | `TypeError` | `undefined` |
| `"1_000"` | `1000.0`        | `1000`               |
| `"0x10"`  | `16.0`          | `16`                 |

The parse grammar is already faithful — that is not what this story changes.
What diverges is the **failure protocol**: MRI raises, and raises two
*different* classes that callers discriminate on, where trails collapses both
into one `undefined`. The current doc comment ratifies the collapse with
"every Rails call site rescues both, so the unparseable cases answer
`undefined` here rather than throwing." That premise is false — see below.

### It is not true that every call site rescues

Rails' four `Float(...)` call sites in the vendored corpus:

| Rails                                                       | rescued?                                       |
| ----------------------------------------------------------- | ---------------------------------------------- |
| `activemodel/validations/numericality.rb:82`                | yes — `is_number?`'s method-level rescue        |
| `activesupport/number_helper/number_to_human_converter.rb:17` | **no** — bare, guarded by `validate_float = true` |
| `activesupport/number_helper/number_to_human_size_converter.rb:14` | **no** — same shape                       |
| `activerecord/.../postgresql/oid/point.rb:64`               | **no** — `build_point` lets it raise           |

Three of the four are bare. In each, raising IS the behaviour, and trails
swallows it:

- `number-to-human-converter.ts:43` and `number-to-human-size-converter.ts:15`
  spell it `kernelFloat(this.number)!` — a non-null assertion that types
  `undefined` as `number` and carries it into the arithmetic below.
- `postgresql/oid/point.ts:77-93` is worse: it invents a private
  `toCoordinate` helper Rails does not have, which swallows the raise into a
  `null` return AND parses with bare `Number()` — the one spelling
  `kernelFloat`'s own doc comment says is wrong, because `Number()` reads
  `0b…`/`0o…` literals Ruby rejects and coerces `""` to `0`. `build_point` in
  Rails is one line calling `Float(x)` twice.

### Why this story and not the ActiveModel one

`0115-activemodel-fidelity-convergence`'s
`numericality-is-number-missing-argumenterror-rescue` wants `isNumber` to carry
Rails' `rescue ArgumentError, TypeError => false` arm
(`numericality.rb:93-100`), and correctly notes the arm is dead code while
`parseAsNumber` cannot raise. That story owns the Rails body; this one owns the
Ruby primitive underneath it, which is the half that has no `.rb` to mirror and
three other callers. Converging here is what makes the rescue arm load-bearing,
so this story lands first and 0115's depends on it.

## Converged shape

- `kernelFloat` moves to `@blazetrails/ruby-compat` under the RFC's settled
  move shape (see `move-rational-to-ruby-compat`,
  `move-regexp-escape-to-ruby-compat`), keeping its MRI citation.
- It **raises**: `ArgumentError` for a String that does not parse, `TypeError`
  for a value that does not respond to the coercion at all — the two classes
  MRI raises, discriminated the same way, using the existing trails error
  classes rather than new ones.
- `Kernel#Float` joins `RUBY_COMPAT_EXPORTS` (`scripts/parity/ruby-compat.ts`)
  beside `Kernel#Rational`, so the call gates can see the call.
- The four call sites adopt it at the Rails shape:
  - the two `number-helper` converters drop the `!` and let it raise, as their
    Ruby does; `validateFloat` already guards them upstream exactly as
    `validate_float` does in Rails.
  - `point.ts` deletes the invented `toCoordinate` and calls the export twice
    in `buildPoint`, mirroring `point.rb:64`. Its `Number()` parse goes with
    it.
  - `numericality.ts` keeps behaviour identical because 0115's rescue arm
    lands with it, so `is_number?` still answers `false`.
- An `activesupport` re-export shim only if the RFC's `delete-ruby-compat-reexport-shims`
  sequencing requires one; prefer no shim.

## Acceptance criteria

- [ ] `kernelFloat` lives in `@blazetrails/ruby-compat`, raises `ArgumentError`
      / `TypeError` per the table above, and is cited to MRI per
      `ruby-compat-mri-citation-lint`.
- [ ] `Kernel#Float` is a row in `RUBY_COMPAT_EXPORTS`.
- [ ] `point.ts` has no `toCoordinate` and no bare `Number()` parse;
      `buildPoint` mirrors `point.rb:64`.
- [ ] The two `number-helper` converters no longer spell `kernelFloat(...)!`.
- [ ] Tests pin each row of the divergence table, and the `""` / `"0b1"` /
      `nil` rows fail on the baseline.
- [ ] `pnpm parity:api:extra:gate` and `pnpm parity:api:calls` are
      non-regressing; `pnpm vitest run packages/activesupport packages/activemodel`
      and the PG point tests are green.
