---
title: "ruby-extractor-records-define-method-names"
status: ready
updated: 2026-07-27
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

> Re-homed from RFC 0072 (api-compare parity burndown), which was pruned to
> ActiveRecord-scoped work. This story changes `scripts/api-compare/` tooling,
> not a package, so it belongs with the fidelity-verification tooling.

`scripts/api-compare/extract-ruby-api.rb` records only literal `def`s. It has
no `define_method` handling at all (`grep -n define_method
scripts/api-compare/extract-ruby-api.rb` returns nothing), so every Rails
method defined metaprogrammatically is absent from `rails-api.json`.

Found while closing `extra-surface-abstractcontroller-apply-mixin-pattern`
(PR #5332). The concrete case there:
`vendor/rails/actionpack/lib/abstract_controller/callbacks.rb:230-252` defines
twelve macros in one loop —

```ruby
[:before, :after, :around].each do |callback|
  define_method "#{callback}_action" do |*names, &blk| ... end
  define_method "prepend_#{callback}_action" do |*names, &blk| ... end
  define_method "skip_#{callback}_action" do |*names| ... end
  alias_method :"append_#{callback}_action", :"#{callback}_action"
end
```

None of `before_action`, `after_action`, `around_action`,
`skip_before_action`, `skip_after_action`, `skip_around_action` (nor the
`prepend_`/`append_` variants) appear under
`AbstractController::Callbacks::ClassMethods` in `rails-api.json`. Confirm
with:

```sh
node -e 'const d=require("./scripts/api-compare/output/rails-api.json");
console.log(d.packages.abstractcontroller.modules["AbstractController::Callbacks::ClassMethods"])'
```

Consequences:

- The six ported TS macros flag as **novel** extra surface no matter which
  file holds them. PR #5332 had to allowlist all six twice (definition site in
  `callbacks.ts` + mixin install site in `base.ts`) — 12 of the 15 entries in
  `extra-surface-allow.json` exist solely because of this gap.
- The Rails denominator is understated wherever a package leans on
  `define_method`, so `api:compare` percentages read higher than reality.
- `prepend_before_action` / `append_before_action` are unported and invisible
  to the "missing" side of the report, so nothing flags them as work.

This is not abstractcontroller-specific — `define_method` in a loop is a
common Rails idiom (attribute methods, delegation, callback macros).

## Acceptance criteria

- `extract-ruby-api.rb` records methods defined via `define_method` with a
  statically-derivable name, including the common
  `[:a, :b].each { |x| define_method "#{x}_suffix" }` interpolation form, and
  the `alias_method :"...", :"..."` companions in the same loop.
- Names that cannot be resolved statically are skipped, not guessed — and the
  skip is visible somewhere (a count in the run output or a `notes` field), so
  the remaining blind spot stays measurable rather than silent.
- Entries carry the same shape as `def`-derived ones (file, line, visibility,
  params where derivable) so arity/order tooling doesn't choke on them.
- `extractorHash` bump and the resulting manifest re-baseline are handled in
  the same PR; the report is re-run and any newly-surfaced deltas are either
  fixed or registered.
- The 12 `*_action` entries in `scripts/api-compare/extra-surface-allow.json`
  are removed — the stale-entry check enforces this once the names resolve.
