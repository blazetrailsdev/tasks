---
title: "Base#render handles only the partial: arm, not Rails' option-shape dispatch"
status: done
updated: 2026-09-03
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: 7
pr: 7439
claim: "2026-09-03T11:34:47Z"
assignee: "port-trails-autoloaders"
blocked-by: null
closed-reason: null
---

## Context

`Helpers::RenderingHelper#render`
(`vendor/rails/actionview/lib/action_view/helpers/rendering_helper.rb:138-141`)
dispatches on the shape of `options`:

```ruby
def render(options = {}, locals = {}, &block)
  case options
  when Hash
    in_rendering_context(options) do |renderer|
      if block_given?
        view_renderer.render_partial(self, options.merge(partial: options[:layout]), &block)
      else
        view_renderer.render(self, options)
      end
    end
  else
    view_renderer.render_partial(self, partial: options, locals: locals, &block)
  end
end
```

trails' `Base#render` (`packages/actionview/src/base.ts`) handles only the
`partial:` arm — its parameter type is literally
`{ partial: string; locals?: Record<string, unknown> }`. The `template:`,
`file:`, `inline:`, `plain:`, `html:` and `layout:`-with-block arms, the
non-Hash (bare partial name) arm, and `in_rendering_context` are all absent.

This is a SEPARATE gap from the render path's asynchrony. The owner has
decided the render path stays async
(`actionview-render-path-is-async-where-rails-is-sync`, closed; both receipts
are `PERMANENT`), and that decision does not depend on which option arms
`render` accepts. `Base#render` can dispatch on the options shape while still
reaching a synchronous partial path for the `partial:` arm — the two are
independent.

Surfaced by review on #7362, which retired the `CONVERGEABLE` receipt that
had been the only tracking for this gap.

## Converged shape

`Base#render` takes `(options = {}, locals = {}, block?)` and dispatches on
the shape of `options` as `rendering_helper.rb:138-141` does, including the
non-Hash arm that treats `options` as a partial name. Reaching the real
renderer for the non-partial arms is what the work is; the `partial:` arm
keeps whatever synchronous path it has, since that is the ratified
asynchrony deviation and is not in scope here.

## Acceptance criteria

- `Base#render` accepts Rails' `(options, locals, &block)` signature with
  Rails' parameter names and defaults.
- The Hash / non-Hash dispatch matches `rendering_helper.rb:138-141`,
  including the bare-partial-name arm.
- `render template:` and `render layout:`-with-block reach the renderer
  rather than throwing.
- The `partial:` arm's behavior is unchanged, and its `PERMANENT` receipt
  stays as-is — this story does not reopen the async decision.
