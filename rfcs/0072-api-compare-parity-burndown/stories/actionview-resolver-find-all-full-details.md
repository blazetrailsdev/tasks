---
title: "actionview-resolver-find-all-full-details"
status: closed
updated: 2026-07-26
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "out of scope for RFC 0072 after scope tightening (2026-07-26): this RFC targets activerecord parity plus only the surface necessary to support it; actionview parity is not pursued here - re-file under a dedicated actionview RFC if that campaign opens"
---

## Context

`Resolver#findAll` in `packages/actionview/src/resolver/resolver.ts` is an
interim bridge added by PR #5350 so `PathSet`'s unconditional
`resolver.findAll(...)` dispatch stops crashing (no TS resolver implemented
`findAll` at all before that). It filters candidates by `details.formats`
only, returns at most one template, and ignores the `detailsKey` and `locals`
arguments.

Rails' real implementation is wider:

- `Resolver#find_all` / `_find_all` —
  `vendor/rails/actionview/lib/action_view/template/resolver.rb:60-77`
- `FileSystemResolver#_find_all` — same file, `:131-144`, which calls
  `filter_and_sort_by_details` to filter candidates on the full
  `TemplateDetails::Requested` (locale, handler, format AND variant), can
  return MULTIPLE matching templates, and threads locals through
  `unbound_template.bind_locals(locals)`.

The narrowness is downstream of a pre-existing decision: trails' resolver
primitive is `find(name, prefix, format, extensions)` (`resolver.ts`), which
has no locale/handler/variant parameters, and `UnboundTemplate`/locals binding
is not ported (`unbound_template.rb` is 0/11 in api:compare). So this is a real
gap on the production render path — `lookup-context.ts:451`,
`renderer/template-renderer.ts` and `renderer/streaming-template-renderer.ts`
all reach `findAll`.

## Acceptance criteria

- `Resolver#findAll`/`_findAll` and `FileSystemResolver#_findAll` follow
  `resolver.rb:60-77` and `:131-144`: candidates filtered and sorted on the
  full `TemplateDetails::Requested` (locale, handler, format, variant), all
  matches returned rather than the first.
- Decide and record whether `find(name, prefix, format, extensions)` survives
  as a helper or is replaced by `find_templates`.
- Locals threading (`bind_locals`) either lands with `UnboundTemplate` or is
  registered as its own story with the dependency noted here.
