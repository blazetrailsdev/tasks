---
title: "Port the six unported prepend_/append_ action callback macros"
status: closed
updated: 2026-07-27
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Out of scope for AR-focused 0072 burndown: actionpack/abstractcontroller is in the web/framework stack, not ActiveRecord's dependency graph (activerecord, activerecord-cli, arel, activemodel, activesupport, globalid, did-you-mean, trails-tsc). Reopen/re-home under a web-stack parity RFC if desired."
---

## Context

`vendor/rails/actionpack/lib/abstract_controller/callbacks.rb:230-252` defines
**twelve** callback macros in one loop; trails ports only six.

```ruby
[:before, :after, :around].each do |callback|
  define_method "#{callback}_action" do |*names, &blk| ... end          # ported
  define_method "prepend_#{callback}_action" do |*names, &blk|          # MISSING
    _insert_callbacks(names, blk) do |name, options|
      set_callback(:process_action, callback, name, options.merge(prepend: true))
    end
  end
  define_method "skip_#{callback}_action" do |*names| ... end           # ported
  alias_method :"append_#{callback}_action", :"#{callback}_action"      # MISSING
end
```

Missing from `packages/actionpack/src/abstract-controller/callbacks.ts`:
`prependBeforeAction`, `prependAfterAction`, `prependAroundAction`,
`appendBeforeAction`, `appendAfterAction`, `appendAroundAction`.

Found while closing `extra-surface-abstractcontroller-apply-mixin-pattern`
(PR #5332), which moved the six ported macros into `callbacks.ts`.

These are invisible to the "missing" side of `api:compare` because
`extract-ruby-api.rb` records no `define_method`-defined names at all — see
[[ruby-extractor-records-define-method-names]]. So nothing flags this gap
today and nothing will until that story lands. Filing separately so the port
is scheduled on its own.

The machinery already exists: `_registerActionCallback` threads
`options.prepend` through to `asSetCallback`'s `prepend: true`
(`callbacks.ts`, the `if (opts.prepend) asOpts.prepend = true` branch), so
`prepend*Action` is `_registerActionCallback(this.prototype, kind, cb,
{ ...options, prepend: true })`. The `append*` trio are straight aliases of
the existing `*Action` functions, matching Rails' `alias_method`.

## Acceptance criteria

- All six names exist in `callbacks.ts` as `this`-typed functions and are
  mixed onto `AbstractController` in `base.ts` via `static X = X`, matching
  how the existing six are installed.
- `prepend*Action` registers ahead of previously-registered callbacks of the
  same kind; `append*Action` is reference-equal to its `*Action` counterpart
  (Rails' `alias_method`, not a delegating wrapper).
- Tests ported from `vendor/rails/actionpack/test/abstract/callbacks_test.rb`
  covering prepend ordering, with names matching Rails verbatim.
- If `ruby-extractor-records-define-method-names` has landed, the six names
  resolve against `AbstractController::Callbacks::ClassMethods` and need no
  `extra-surface-allow.json` entries; if it has not, add entries with the same
  metaprogramming rationale as the existing twelve.
