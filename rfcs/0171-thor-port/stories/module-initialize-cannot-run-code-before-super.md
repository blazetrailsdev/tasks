---
title: "A module initialize cannot run code before super, so Thor::Actions' force / skip option rewrite arrives after the parse"
status: in-progress
updated: 2026-10-04
rfc: "0171-thor-port"
cluster: null
packages: ["ruby-compat", "trailties"]
deps: []
deps-rfc: []
est-loc: 200
priority: 2
pr: trails#8495
claim: "2026-10-04T19:31:17Z"
assignee: "port-thor-actions-module"
blocked-by: null
closed-reason: null
---

## Context

`Thor::Actions#initialize` (`vendor/thor/v1.3.2/lib/thor/actions.rb:72-85`) runs code on both
sides of `super`:

```ruby
self.behavior = case config[:behavior].to_s
when "force", "skip"
  _cleanup_options_and_set(options, config[:behavior])
  :invoke
...
super
self.destination_root = config[:destination_root]
```

`_cleanup_options_and_set` mutates `options` before `Thor::Base#initialize`
(`vendor/thor/v1.3.2/lib/thor/base.rb:60-109`) parses them, which is how `behavior: :force`
turns into `options.force == true`.

trails runs module initializers through `initializeIncludedModules`
(`packages/ruby-compat/src/include.ts`), which calls each included module's `[initialize]` in
include order, base-most level first. That models a body written after `super`
(`Thor::Shell#initialize`). It cannot model a body written before `super`: `Actions` is
included into a subclass of the class that includes `Thor::Base`, so its whole initializer runs
after `Base`'s has already parsed `options`. The port in `packages/trailties/src/thor/actions.ts`
keeps Ruby's body in one function, so `behavior` and `destinationRoot` are right, but the
`"force"` / `"skip"` arm's option rewrite arrives too late to reach `this.options` on a Thor
host. (`GeneratorBase` still does the rewrite by hand in its own constructor,
`packages/trailties/src/generators/base.ts`.)

The two spec cases that cover it are unported for that reason
(`vendor/thor/v1.3.2/spec/actions_spec.rb:35-47`):
"when behavior is set to force, overwrite options" and
"when behavior is set to skip, overwrite options".

## Acceptance criteria

- [ ] A module `initialize` can run code before the rest of the `super` chain, so
      `Actions`' initializer runs its `case` before `Thor::Base`'s parse and its
      `destination_root=` after, as one function at the Rails name.
- [ ] Both spec cases above are ported into `packages/trailties/src/thor/actions.test.ts`,
      hosted on a Thor class, and pass.
- [ ] Existing module initializers (`Thor::Shell`, `Thor::Base`, the ActiveRecord and
      ActionController ones) keep their order.
