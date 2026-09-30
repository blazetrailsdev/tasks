---
title: "action-controller-rendering-is-not-an-includable-module"
status: draft
updated: 2026-09-30
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`controller/new_base/render_plain_test.rb` (`vendor/rails/v8.0.2/actionpack/test/controller/new_base/render_plain_test.rb:5-13`)
defines

```ruby
class MinimalController < ActionController::Metal
  include AbstractController::Rendering
  include ActionController::Rendering
  def index; render plain: "Hello World!"; end
end
```

trails has `AbstractController::Rendering` as a live `Module`
(`packages/actionpack/src/abstract-controller/rendering.ts:126`), but no
`ActionController::Rendering` module (`action_controller/metal/rendering.rb:6`):
`packages/actionpack/src/action-controller/metal/rendering.ts` exports loose functions
(`render`, `renderToBody`, `_renderInPriorities`, `_processOptions`, `_normalizeOptions`,
`_setRenderedContentType`, ...) that `ActionController::Base` hand-assigns onto its
prototype (`base.ts` ~862-900). `renderToBody` does not take `this` and does not call
`super` (`metal/rendering.rb:185-187`: `super || _render_in_priorities(options) || " "`).
So a Metal subclass cannot `include` ActionController::Rendering, and
`packages/actionpack/src/action-controller/controller/new-base/render-plain.test.ts`
skips "rendering text from a minimal controller" and "rendering from minimal controller
returns response with text/plain content type".

## Acceptance criteria

- `ActionController::Rendering` exists as a `Module` in `metal/rendering.ts` whose methods
  are `this`-bound and reach `super` through `Rendering.superMethod`, in Rails' order
  (`metal/rendering.rb:164-260`), including its `ClassMethods` (`setup_renderer!`).
- `ActionController::Base` includes it instead of hand-assigning the functions.
- The two skipped minimal-controller tests in `render-plain.test.ts` are unskipped and pass.
