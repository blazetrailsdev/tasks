---
title: "setCurrentAdapterResolver indirection stands in for Rails' direct ActiveRecord::Base reference"
status: draft
updated: 2026-07-24
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' private `Type.current_adapter_name`
(vendor/rails/activerecord/lib/active_record/type.rb:54-56) is literally
`adapter_name_from(ActiveRecord::Base)` — a direct constant reference.

trails cannot write that: `base.ts` imports `type.ts`, so `type.ts` referencing
`Base` would close an import cycle. #5181 therefore kept a module-level
`_currentAdapterResolver` that `base.ts` installs at load
(`setCurrentAdapterResolver(() => Base)`, base.ts bottom-of-file wiring, next to
`DatabaseTasks._registerBase` and `runLoadHooks`). `setCurrentAdapterResolver`
has no Rails counterpart and is public API surface that only exists to break the
cycle; `currentAdapterName()` still carries a `"sqlite"` fallback for the window
before the resolver is installed.

Related: [[type-adapter-name-from-swallows-unconfigured-instead-of-raising]].

## Acceptance criteria

- `setCurrentAdapterResolver` is either removed (with `type.ts` reaching `Base`
  some cycle-safe way — lazy import, a shared registry module, or the same
  mechanism other cycle-broken references in the package already use) or
  documented as a sanctioned trails invention with an api-compare SKIP_GROUPS
  entry giving the reason.
- `currentAdapterName()` has no resolver-not-yet-installed branch.

## Definition of done

## Verification
