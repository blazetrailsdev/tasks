---
title: "Mapper route DSL validates on: but never dispatches it (decomposed_match's send(on) arm)"
status: draft
updated: 2026-09-26
rfc: "0141-actionpack-surfaced-deviations"
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

Rails' `decomposed_match` (`vendor/rails/actionpack/lib/action_dispatch/routing/mapper.rb:2023-2036`)
dispatches the `on:` option before the scope-level arms:

```ruby
def decomposed_match(path, controller, options, _path, to, via, formatted, anchor, options_constraints)
  if on = options.delete(:on)
    send(on) { decomposed_match(path, controller, options, _path, to, via, formatted, anchor, options_constraints) }
  else
    case @scope.scope_level
    when :resources
      nested { decomposed_match(...) }
    when :resource
      member { decomposed_match(...) }
    else
      add_route(...)
    end
  end
end
```

trails' route DSL (`get`/`post`/…/`match`) reaches `Mapper#addRoute`
(`packages/actionpack/src/action-dispatch/routing/mapper.ts`), which since
trails#8142 carries the two scope-level arms (`resources` → `nested`,
`resource` → `member`) but only VALIDATES `options.on`
(`assertValidOnOption`) and never dispatches on it. So
`get("preview", { on: "member" })` inside `resources("posts")` is drawn under
`nested` (`/posts/:post_id/preview`) instead of `member`
(`/posts/:id/preview`), and `on: "collection"` / `on: "new"` likewise land in
the nested path. (`Mapper#decomposedMatch` has an `on` arm but is reached only
from `mapMatch`, which the DSL verbs do not call.)

## Converged shape

`addRoute` (or the DSL verbs routed through `mapMatch` → `decomposedMatch`, as
Rails routes them) deletes `on` from the options and calls `this[on](() => …)`
with the same arguments before the scope-level arms, exactly as
`mapper.rb:2024-2025`.

## Acceptance criteria

- `get("x", { on: "member" })` inside `resources("posts")` draws `/posts/:id/x`;
  `on: "collection"` draws `/posts/x`; `on: "new"` draws `/posts/new/x`.
- `on` is removed from the options before the route is built, as `options.delete(:on)` does.
- The `routing.test.ts` / `resources.test.ts` Rails tests exercising `on:` are enabled where currently skipped.
