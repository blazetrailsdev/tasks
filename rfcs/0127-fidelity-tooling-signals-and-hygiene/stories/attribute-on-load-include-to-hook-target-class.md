---
title: "Attribute an on_load block's include to the hook's target class instead of dropping it"
status: draft
updated: 2026-09-04
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #7463 stopped `scripts/api-compare/extract-ruby-api.rb`'s `process_include`
attributing an `include` inside an `ActiveSupport.on_load` block to the
lexically enclosing class. That was correct — Rails'
`activerecord/lib/active_record/railtie.rb:271-273` includes
`ActiveRecord::Railties::JobRuntime` into `ActiveJob::Base`, not into
`ActiveRecord::Railtie` — but it only removed the FALSE attribution. It did not
add the TRUE one, so those modules' methods are now expected on no class at
all.

The measurable cost is in actionpack.
`actionpack/lib/action_dispatch/middleware/cookies.rb:94` reads:

```ruby
ActiveSupport.on_load(:action_dispatch_request) do
  include RequestCookieMethods
end
```

Rails includes `RequestCookieMethods` into `ActionDispatch::Request`. Before
PR #7463 those methods were expected on the enclosing `ActionDispatch::Cookies`
(wrong class); after it they are expected nowhere, which is why actiondispatch's
population fell 1744 -> 1727 expected methods. trails may well port them onto
`Request`, in which case they are now scored as extra surface rather than as a
match.

The same shape covers the other on_load-include sites the sweep found:
`actioncable/engine.rb:21`, `actionmailer/railtie.rb:38,66`,
`actiontext/engine.rb:30,43,80`, `activejob/railtie.rb:87`,
`activestorage/engine.rb:129,166`, `activesupport/railtie.rb:55`,
`railties/test_help.rb:18`, plus `railtie.rb:268` (ControllerRuntime).

## Converged shape

Give the extractor a hook -> class map for the `on_load` symbols Rails
registers (`:action_dispatch_request` -> `ActionDispatch::Request`,
`:active_job` -> `ActiveJob::Base`, `:action_controller` ->
`ActionController::Base`, `:active_record` -> `ActiveRecord::Base`, ...), and
attribute an `include`/`extend` inside `ActiveSupport.on_load(:hook)` to THAT
class rather than to `current_fqn` or to nothing.

`on_load_block?` (extract-ruby-api.rb:1067) already identifies the block; it
needs to yield the hook symbol instead of a boolean, and `process_include` /
`process_extend` need to retarget rather than early-return.

Only hooks with a known target retarget; an unknown hook keeps #7463's
record-nothing behaviour, so the map is only-grow and a missing entry is never
a wrong attribution.

## Acceptance criteria

- `ActiveSupport.on_load(:action_dispatch_request) { include RequestCookieMethods }`
  attributes `RequestCookieMethods`' methods to `ActionDispatch::Request`, not
  to `ActionDispatch::Cookies` and not to nothing.
- `railtie.rb:271-273` attributes `JobRuntime#instrument` to `ActiveJob::Base`
  (a class no api-compared package extracts today), NOT to
  `ActiveRecord::Railtie` — #7463's regression test stays green.
- An `on_load` hook with no mapped target still records nothing.
- Extractor test cases for a mapped hook, an unmapped hook, and a plain
  class-body include (the last two already exist from #7463).
- The actiondispatch expected-method population is restored to the extent the
  hook map covers it; report the before/after per package in the PR body.
- No package's missing-count grows without a stated reason.
