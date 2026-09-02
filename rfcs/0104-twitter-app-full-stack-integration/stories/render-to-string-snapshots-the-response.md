---
title: "render_to_string writes the response and then restores it, where Rails never touches it"
status: draft
updated: 2026-09-02
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `render_to_string` never touches the response. It is two lines
(`vendor/rails/actionpack/lib/abstract_controller/rendering.rb:44-47`):

```ruby
def render_to_string(*args, &block)
  options = _normalize_render(*args, &block)
  render_to_body(options)
end
```

with an ActionController override that only joins the result
(`actionpack/lib/action_controller/metal/rendering.rb:174-183`):

```ruby
def render_to_string(*)
  result = super
  if result.respond_to?(:each)
    string = +""
    result.each { |r| string << r }
    string
  else
    result
  end
end
```

`render_to_body` returns the rendered body; nothing is assigned to
`response_body`, the status, or the headers, so there is nothing to restore.

trails' `Base#renderToString`
(`packages/actionpack/src/action-controller/base.ts:462-487`) instead calls the
full `render()` — which does write the response — and then snapshots and
restores four slots around it:

```ts
const oldBody = this._responseBody;
const oldPerformed = this._performed;
const oldStatus = this.response.status;
const oldHeaders = this.response.headers.toHash();
try {
  this.render(options);
  return this.body;
} finally {
  // ... restore all four, deleting every header and re-setting the old ones
}
```

The restore loop is invented surface with no Rails counterpart, and it is
lossy: it cannot restore a header the render deleted-then-recreated with a
different value ordering, and it silently drops anything `render()` wrote
outside those four slots (cookies, `_cacheControl`, the stream). PR #7376
widened it — `oldContentType` folded into `oldHeaders` when the mirror fields
went away — which is what surfaced it.

## Converged shape

`renderToString` calls `_normalizeRender` then `renderToBody` and returns the
joined result, per `rendering.rb:44-47` + `metal/rendering.rb:174-183`. No
snapshot, no restore, no `finally`. That requires `renderToBody` to exist as
the render half that does not commit — check whether trails' `render()` can be
split at the same seam Rails splits it, and file the split separately if not.

## Acceptance criteria

- `Base#renderToString` matches `abstract_controller/rendering.rb:44-47` and
  the ActionController override at `metal/rendering.rb:174-183`.
- The snapshot/restore block is deleted, not narrowed.
- `render_to_string` leaves `performed?`, the status, the headers and the body
  untouched, asserted by a test that writes all four before calling it.
