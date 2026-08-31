---
title: "Resolvers bind templates eagerly and drop locals; UnboundTemplate is unported"
status: draft
updated: 2026-08-31
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionView::UnboundTemplate`
(`vendor/rails/actionview/lib/action_view/unbound_template.rb`) is unported —
`packages/actionview/src/unbound-template.ts` scores 0/11 in
`pnpm parity:api --package actionview`.

Rails' resolvers deal in unbound templates: `build_unbound_template` returns
`UnboundTemplate.new(source, template, details:, virtual_path:)`
(`vendor/rails/actionview/lib/action_view/template/resolver.rb:145-155`),
`filter_and_sort_by_details` filters on `template.details`
(`resolver.rb:172-181`), and `_find_all` binds last with
`unbound_template.bind_locals(locals)` (`resolver.rb:136-138`) — which memoizes
one `Template` per locals set.

trails binds eagerly and carries the pair as a local interface:

```ts
// packages/actionview/src/template/resolver.ts
export interface TemplateWithDetails {
  template: Template;
  details: TemplateDetails;
}
```

so `locals` is dropped on the floor in `FileSystemResolver#_findAll` (the
parameter is `_locals`), and every candidate's source is read from disk even
when the details cascade discards it.

## Converged shape

Port `UnboundTemplate` with Rails' `details` / `virtual_path` readers and
`bind_locals` memoization, have `buildUnboundTemplate` return one, and let
`_findAll` end with `.map((t) => t.bindLocals(locals))`. `TemplateWithDetails`
then goes away.

Pairs with [[port-template-sources-file-for-lazy-resolver-sources]]: the lazy
`Template::Sources::File` is what makes deferring the read worthwhile.

## Acceptance criteria

- `packages/actionview/src/unbound-template.ts` ports `UnboundTemplate`.
- `FileSystemResolver#_findAll` binds locals rather than ignoring them, and
  `TemplateWithDetails` is deleted.
- `unbound_template.rb` is no longer 0% in `pnpm parity:api --package actionview`.
