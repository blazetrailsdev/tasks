---
title: "Scope ruby-compat's ruby/spec measure per ported member, and reach the suite-level shared bodies"
status: done
updated: 2026-09-01
rfc: "0129-ruby-compat"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 40
pr: 7330
claim: "2026-09-01T12:03:02Z"
assignee: "converge-argument-error-onto-ruby-compat-activesupport"
blocked-by: null
closed-reason: null
---

## Context

`ruby-spec-behavioural-enrollment` (#7300, merged) enrolled ruby/spec as
ruby-compat's `parity:test` measure, but landed with **two defects in the
selection** that were found and fixed after the merge window closed. The work
below is complete and verified locally; it was never committed.

### 1. The selection unit is still the DIRECTORY for four types

PR #7300 correctly narrowed `String`, `Regexp` and `Symbol` to their ported
members' spec files, but treated `hash`, `range`, `rational` and `comparable`
as "whole-type ports" and took their whole directories. That premise is false —
ruby-compat ports **no** type whole:

| Type         | ruby-compat ports | ruby/spec has |
| ------------ | ----------------- | ------------- |
| `Hash`       | 16 members        | 69 files      |
| `Range`      | 13 members        | 30 files      |
| `Rational`   | 14 members        | 33 files      |
| `Comparable` | 6 members         | 7 files       |

So the measure presents test names for members the package deliberately does not
have (`Comparable#clamp`, `Rational#abs`/`#floor`/`#ceil`/`#truncate`,
`Hash#dig`, `Range#step`/`#each`/`#size`, …). That is the inversion the RFC's
standing rule forbids — the suite must not drive surface into the package — and
it is the same defect #7300 fixed one level up for String/Regexp/Symbol.

### 2. `testPath: "spec/ruby/core"` cannot see the suite-level shared bodies

A member spec is usually a one-line `it_behaves_like` shell whose body is a
shared file. Those sit in **either** `core/<type>/shared/` **or** the
suite-level `shared/<type>/` — and **all** of Rational's are in the latter
(`core/rational/plus_spec.rb:2` requires `../../shared/rational/plus`), which is
outside `spec/ruby/core` entirely. Rational therefore measured **3** tests (the
only ones its specs write inline) instead of 65. `shared/hash/` has one body too.

## Converged shape

Verified locally end to end; `git show 3aa07a11c` is the merged baseline.

1. **`vendor/sources.ts`** — `testPath: "spec/ruby"` (the suite root, not
   `core/`), because the scoping is the selection's job, not the path's.
2. **`vendor/sources.test.ts`** — the `testPath` and `resolvePath` expectations.
3. **`scripts/rails-find/core.ts`** — `TEST_BASE["ruby-compat"]` becomes
   `vendor/ruby/spec/ruby`.
4. **`scripts/test-compare/extract-ruby-tests.rb`** — replace
   `RUBY_COMPAT_SPEC_DIRS`/`RUBY_COMPAT_SPEC_FILES` with one member map, and
   glob BOTH shared locations:

```ruby
RUBY_COMPAT_SPECS = {
  "comparable" => %w[between equal_value gt gte lt lte],
  "hash" => %w[
    default default_proc delete_if each_key each_pair except fetch has_key
    include key member merge reject slice transform_values update
  ],
  "range" => %w[
    begin case_compare cover end equal_value exclude_end first include last
    max member min to_s
  ],
  "rational" => %w[
    comparison denominator div inspect modulo multiply numerator plus quo round
    to_f to_i to_s zero
  ],
  "regexp" => %w[escape quote],
  "string" => %w[next succ],
  "symbol" => %w[name to_s],
}.freeze

# in `run`, the pkg_name == "ruby-compat" branch:
test_files = RUBY_COMPAT_SPECS.flat_map do |type, members|
  Dir.glob(File.join(pkg_dir, "core", type, "shared", "*.rb")) +
    Dir.glob(File.join(pkg_dir, "shared", type, "*.rb")) +
    members.map { |m| File.join(pkg_dir, "core", type, "#{m}_spec.rb") }
end
test_files.uniq!
```

Member lists are derived from ruby-compat's actual exports; aliases are included
with their principal because they share one shared body (`Hash#include?` /
`#member?` / `#key?` are `#has_key?` — `hash/include_spec.rb:6`
`it_behaves_like :hash_key_p`; `Range#member?` is `#include?`; `String#next` is
`#succ`; `Regexp.quote` is `.escape`; `Symbol#to_s` is `#id2name`).
`Rational#numerator`/`#denominator` and `Range#begin`/`#end`/`#exclude_end?` are
ported as public readonly fields (`rational.ts:96` cites
`vendor/ruby/rational.c:580` `nurat_numerator`), so they count as ported members.

## Acceptance criteria

- The four directory-level types are selected per member; no spec for an
  unported member is in the measure.
- Both shared-body locations globbed; `Rational` reports 65 tests, not 3.
- `pnpm parity:test` reports ruby-compat at **479 tests / 55 files** (from 1,075
  / 119), with **0** test cases carrying an empty ancestor list or a line
  outside its file's real length.
- Every other package's `totalTests` byte-identical to the pre-change manifest.
- `pnpm rails:find "Rational#+"` resolves to
  `vendor/ruby/spec/ruby/core/rational/plus_spec.rb:6`.
- `parity:test:assertions` OK; `scripts/test-compare` + `scripts/rails-find` +
  `vendor/` suites green (261 tests); `pnpm lint` clean.
