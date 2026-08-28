---
title: "Expand hash-literal and same-file-constant define_method loops in the test extractor"
status: draft
updated: 2026-08-28
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #7147 (story `test-compare-blind-to-define-method-loop-tests`) taught
`scripts/test-compare/extract-ruby-tests.rb` to expand
`[...].each do |x| define_method("test_#{...}") ... end` loops whose receiver is
a **literal array** (constant paths, symbols, strings, `%w`/`%i`), and to
**report** by `file:line` every generating loop it cannot expand. 32 arel cases
came back (`visitors/dot_test.rb` 16 -> 48); 34 loops now report and their cases
are still missing from `scripts/test-compare/output/rails-tests.json`, so every
package holding one still scores against a Rails total that is too low.

The reported loops, from the `pnpm parity:test` run that landed #7147:

- activerecord (11) — `tasks/database_tasks_test.rb:276, :735, :1246, :1477,
  :1510, :1651, :1668, :1716, :1769` (`ADAPTERS_TASKS.each do |k, v|` — a
  constant hash, two block params), `locking_test.rb:570`,
  `relation/delegation_test.rb:22`
- activesupport (14) — `inflector_test.rb:68, :91, :98, :105, :123, :130, :587,
  :597, :606, :615`, `time_zone_test.rb:51, :78`, `json/encoding_test.rb:22`,
  `cache/behaviors/encoded_key_cache_behavior.rb:7` (`Encoding.list.each`)
- actiondispatch (5) — `journey/path/pattern_test.rb:16, :40, :64` (a hash
  literal receiver destructured as `|path, expected|`),
  `journey/router_test.rb:319, :341`
- actioncontroller (2) — `controller/test_case_test.rb:889` (nested double
  loop), `controller/url_for_integration_test.rb:77`
- actionview (2) — `template/erb_util_test.rb:10, :17`

Three shapes cover most of them, in rising cost:

1. **Hash-literal receiver with a destructured block var** — pattern_test.rb:16,
   erb_util_test.rb:10. The keys are literals; only `block_var_name`'s
   single-required-param restriction and `array_literal_values` stand in the way.
2. **A same-file constant as the receiver** — `ADAPTERS_TASKS` is assigned a
   literal hash at `activerecord/test/cases/tasks/database_tasks_test.rb:8`, so
   it resolves without evaluating Ruby.
3. **A runtime receiver** — `Encoding.list`, `inflections.uncountable`,
   `Array.public_instance_methods`. Not statically resolvable; these should stay
   reported.

`scripts/api-compare/extract-ruby-api.rb:1579` (`process_each_metaprogramming`)
already unrolls the literal-array `.each` + `define_method` shape on the **api**
side — worth reading before reimplementing, and a candidate for a shared shape.

## Acceptance criteria

- The test extractor expands hash-literal receivers with a destructured block
  variable, emitting one `style: "define_method"` case per entry with the name
  the interpolation produces.
- It resolves a receiver that names a same-file constant assigned a literal
  array or hash.
- Loops with a genuinely runtime receiver stay reported by `file:line`; the
  reported count drops from 34 to only those.
- `pnpm parity:test` shows the new Rails totals, and
  `eslint/rails-test-names.json` carries the newly expanded names.

## Note

`qualified_const_name` (added by #7147) approximates Ruby's lexical constant
lookup for `klass.name` by qualifying a non-rooted path with the OUTERMOST
enclosing namespace. That is exact for the only corpus file interpolating
`.name` (`activerecord/test/cases/arel/visitors/dot_test.rb`), but it is a
heuristic; if a newly expanded loop interpolates `.name` from a nested
namespace, check the generated names against the Ruby before trusting them.
