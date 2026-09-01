---
title: "wrap_parameters names the wrapping helper, not Rails' class macro — the macro's four arms are unported"
status: draft
updated: 2026-09-01
rfc: "0112-one-rails-thing-n-trails-things"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `wrap_parameters` is a CLASS MACRO on the controller —
`actionpack/lib/action_controller/metal/params_wrapper.rb:221-240`:

    def wrap_parameters(name_or_model_or_options, options = {})
      model = nil
      case name_or_model_or_options
      when Hash   then options = name_or_model_or_options
      when false  then options = options.merge(format: [])
      when Symbol, String then options = options.merge(name: name_or_model_or_options)
      else model = name_or_model_or_options
      end
      opts = Options.from_hash _wrapper_options.to_h.slice(:format).merge(options)
      opts.model = model
      opts.klass = self
      self._wrapper_options = opts
    end

— a four-armed dispatch on one polymorphic argument that ends by REPLACING
`_wrapper_options`.

trails binds the same Rails name to a different thing: `packages/actionpack/src/
action-controller/metal/params-wrapper.ts:69-83` `wrapParameters(params, name,
include, exclude)` is the wrapping HELPER that builds `{...params, [name]:
wrapped}` — the work Rails does in `_wrap_parameters` / `_extract_parameters`
(`params_wrapper.rb:277-297`), not the macro. So the macro's configuration
surface is unported: no Hash arm, no `false` arm (`format: []`, i.e. disable
wrapping), no Symbol/String arm, no model arm, and no `Options.from_hash
_wrapper_options.to_h.slice(:format).merge(options)` carry-over of the inherited
`format`. `Options` and `_wrapperOptions` exist (`params-wrapper.ts:86-95`), so
the seat the macro writes is there; nothing writes it the Rails way.

Surfaced while adjudicating PR #7339 (RFC 0129): the `wrap_parameters -> merge`
and `wrap_parameters -> slice` rows in
`scripts/api-compare/call-mismatches-exclude/actioncontroller/metal/params-wrapper.json`
are not Hash-call-form work — the receivers (`options`,
`_wrapper_options.to_h`) belong to a body that does not exist here — so they were
left baselined naming that, rather than converged.

## Acceptance criteria

- `wrapParameters` ports `params_wrapper.rb:221-240` as the class macro: the
  four-armed `case` in Rails' order, Rails' parameter names
  (`nameOrModelOrOptions`, `options`), and the `Options.fromHash(slice(
  _wrapperOptions.toH(), "format") merged with options)` construction, setting
  `model`, `klass` and then `_wrapperOptions`.
- The wrapping helper the name currently holds moves to the Rails member it
  actually is (`_wrapParameters` / `_extractParameters`,
  `params_wrapper.rb:277-297`) or is folded into the existing one, so no Rails
  name binds a body Rails does not have there. `pnpm parity:api:extra --package
  actioncontroller` gains nothing.
- The `merge` and `slice` rows are deleted from
  `call-mismatches-exclude/actioncontroller/metal/params-wrapper.json` by hand
  (only-shrink, never a reseed); stale marks narrowed with
  `pnpm parity:api:calls:tighten`.
- Rails' `ParamsWrapperTest` cases covering the macro's arms — including
  `wrap_parameters false` — are ported under their verbatim names.
- `pnpm parity:api` / `parity:test` deltas non-negative; the actionpack suite
  green.
