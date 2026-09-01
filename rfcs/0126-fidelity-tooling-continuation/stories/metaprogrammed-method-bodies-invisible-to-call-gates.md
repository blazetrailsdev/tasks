---
title: "define_method/class_eval bodies carry no calls, so the call gates never see them"
status: in-progress
updated: 2026-09-01
rfc: "0126-fidelity-tooling-continuation"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: 1
pr: 7341
claim: "2026-09-01T16:00:48Z"
assignee: "metaprogrammed-method-bodies-invisible-to-call-gates"
blocked-by: null
closed-reason: null
---

## Context

`record_metaprogrammed_method` (`scripts/api-compare/extract-ruby-api.rb`)
records a generated method's name, visibility and params, and nothing else. It
never emits `calls`, `callArgs`, `skeleton` or `bodyDigest`, so every method a
`define_method` / `class_eval` loop installs is invisible to the call-set gate
(`parity:api:calls`), the call-argument gate (`parity:api:calls:args`) and the
body-pin machinery. The manifest presents them as zero-call methods, which is
indistinguishable from a method whose body genuinely calls nothing — so a port
that drops the body's calls entirely is scored green.

This predates PR #7179 and applies uniformly to every such loop in every
package; #7179 only made the population bigger (+64 activerecord entries alone,
and the four `.send(format)` accessors below are its most pointed instance).

The two shapes:

- **`define_method` with a block.** The block body IS the method body and is
  right there in the AST. `i18n/lib/i18n/locale/tag/rfc4646.rb:32-34`:

  ```ruby
  RFC4646_FORMATS.each do |name, format|
    define_method(name) { self[name].send(format) unless self[name].nil? }
  end
  ```

  Rails' `language` / `script` / `region` / `variant` each call `send` with a
  per-member format, and `[]` twice. The manifest says they call nothing, so
  `parity:api:calls` can never check that `rfc4646.ts` performs the
  format-dependent dispatch Rails does.

- **`class_eval` with a string template.** The body is a heredoc, so the calls
  have to be recovered by re-parsing the interpolated template per member —
  e.g. `activerecord/lib/active_record/migration/command_recorder.rb:125-131`
  generates 43 methods whose body is `record(:"#{method}", args, &block)`, and
  `activerecord/lib/active_record/association_relation.rb:18-28` generates 6
  whose body raises `ArgumentError` then calls `super`.

## Converged shape

`record_metaprogrammed_method` takes the generated body and runs it through the
same call/skeleton collection the literal-`def` path uses, so a generated entry
is indistinguishable from a `def`-written one in the manifest.

Start with the `define_method`-block half: the block body is already an AST
node, so it can be handed to the existing collector directly with no
re-parsing — that alone covers `rfc4646.rb:32-34` and
`activesupport/promise.rb:40-41`. The `class_eval` half needs the template
reconstructed per member (`codegen_template` already builds it with a sentinel)
and re-run through Ripper, which is the larger and riskier piece; split it out
if the first half runs long.

Expect new rows on `parity:api:calls` / `parity:api:calls:args` the moment
generated bodies start carrying calls — those are pre-existing port divergences
becoming visible, not regressions. Hand-add baseline rows via `serializeBaseline`
(never `--write`), the way a new codegen handler's convergence-guard rows are
handled.

## Acceptance criteria

- A `define_method(name) { ... }` entry carries the block body's `calls` and
  `callArgs`, matching what the same body written as a literal `def` produces.
- `rfc4646.rb`'s four `RFC4646_FORMATS` accessors record `send` and `[]`.
- The `class_eval` template half is either delivered or filed as its own story
  with the template-reparse design captured.
- `parity:api:calls` and `parity:api:calls:args` are green, with any newly
  surfaced divergence either converged or baselined with a reviewed one-line
  reason.
- No package's `parity:api` method count falls.
