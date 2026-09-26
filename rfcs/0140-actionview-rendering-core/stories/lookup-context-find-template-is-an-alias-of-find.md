---
title: "LookupContext#find_template is an alias of find, not a formats-taking findAll[0]"
status: draft
updated: 2026-09-26
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionView::LookupContext::ViewPaths` defines `find_template` as an alias of
`find` (`vendor/rails/v8.0.2/actionview/lib/action_view/lookup_context.rb:128-132`):

```ruby
def find(name, prefixes = [], partial = false, keys = [], options = {})
  name, prefixes = normalize_name(name, prefixes)
  details, details_key = detail_args_for(options)
  @view_paths.find(name, prefixes, partial, details, details_key, keys)
end
alias :find_template :find
```

trails' `LookupContext#findTemplate` (`packages/actionview/src/lookup-context.ts`,
`findTemplate(name, prefixes, formats)`) is a different method: it takes
`formats` in the third position where Rails takes `partial`, always passes
`partial = false`, and returns `findAll(...)[0] ?? null` instead of raising
`MissingTemplate`. Callers (`template-renderer.ts`, `streaming-template-renderer.ts`)
then re-raise themselves. `findPartial` / `findLayout` are trails-only siblings
of the same shape.

Surfaced in trails#8133, which moved `PartialRenderer#find_template`
(`partial_renderer.rb:262-265`) onto `lookupContext.find` because
`findTemplate` could not be called with Rails' arguments.

## Converged shape

`findTemplate` is `find` (same signature, same raise), and each caller passes
Rails' arguments (`template_renderer.rb` `determine_template`:
`@lookup_context.find_template(options[:template], options[:prefixes], false, keys, @details)`)
and drops its own re-raise.

## Acceptance criteria

- `LookupContext#findTemplate` has `find`'s signature and behaviour (raises `MissingTemplate`).
- `TemplateRenderer` / `StreamingTemplateRenderer` call it with Rails' argument list, with no re-raise.
- `parity:api:calls:args` reports no new row.
