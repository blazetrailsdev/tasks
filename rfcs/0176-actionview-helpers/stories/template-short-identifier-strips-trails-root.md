---
title: "Template#shortIdentifier strips Trails.root as Rails' short_identifier does"
status: ready
updated: 2026-10-21
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `Template#short_identifier` is `@short_identifier ||= defined?(Rails.root) ? identifier.delete_prefix("#{Rails.root}/") : identifier` (`vendor/rails/v8.0.2/actionview/lib/action_view/template.rb`, `short_identifier`). The trails port, `packages/actionview/src/template.ts:213-215`, is `this._shortIdentifier ??= this.identifier` and never strips the root. That puts absolute paths in `inspect`, in the strict-locals `ArgumentError` message (`template.ts` `compile`), and in the `annotate_rendered_view_with_filenames` comments that `Tse#call` (`template/handlers/tse.ts`) renders at run time. trails#9196 worked around this at build time only: `build-views` passes `path.relative(cwd, identifier)` to `tseHandlerScope`.

## Acceptance criteria

- `Template#shortIdentifier` strips `${Trails.root}/` when a root is defined (read at call time through the `TopLevel` seat, as § "Call-time constant resolution" describes), else answers `identifier`. This mirrors Rails' `defined?(Rails.root)` arm.
- `build-views` drops its `path.relative` override and passes the template's own `shortIdentifier`.
- Tests: an annotated render under a set root shows the root-relative path, and `inspect` does too.
