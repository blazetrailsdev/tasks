---
title: "Relation scoping reads a global ScopeRegistry instead of model.scope_registry"
status: draft
updated: 2026-07-25
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the RFC 0072 model-accessor sweep (PR #5322).

Rails resolves the scope registry **per model**, off the model class:

- `vendor/rails/activerecord/lib/active_record/relation.rb:542` (`scoping`) —
  `registry = model.scope_registry`
- `vendor/rails/activerecord/lib/active_record/relation.rb:554` (`_exec_scope`) —
  `registry = model.scope_registry`

trails `packages/activerecord/src/relation.ts` (`scoping`, `_execScope`) reads
the process-wide singleton `ScopeRegistry.instance()` and never touches the
model. This is why `_exec_scope` could not be converged by the accessor sweep:
there is no model read to route.

Whether this is observable depends on how `Model.scope_registry` is defined in
Rails (it is per-`connection_class`/`current_scope` isolated), so the first
step is to confirm the divergence is real rather than a same-object alias.
`vendor/rails/activerecord/lib/active_record/scoping.rb` is the anchor.

Baseline entry carrying this finding:
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/relation.json`,
`rubyName: _exec_scope`, `call: model`.

## Acceptance criteria

- Determine whether `model.scope_registry` is genuinely per-model in Rails
  (read `scoping.rb`); if it is, port the accessor and route `scoping` /
  `_execScope` through `this.model.scopeRegistry`.
- If it resolves to the same global object in every case trails supports,
  close this story and rewrite the wide-baseline `reason` to record that
  conclusion with the Rails file:line, so it is not re-derived.
- Any behavior change is covered by a test mirroring the Rails case verbatim.
