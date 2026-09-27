---
title: "Mapper#concerns is spelled useConcerns: drops options, flatten and the unknown-concern ArgumentError"
status: ready
updated: 2026-09-27
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: ["actionpack"]
deps: ["routing-route-class-has-no-rails-counterpart"]
deps-rfc: []
est-loc: 90
priority: 9
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `Mapper::Concerns` (`vendor/rails/actionpack/lib/action_dispatch/routing/mapper.rb:2146-2171`):

```ruby
def concern(name, callable = nil, &block)
  callable ||= lambda { |mapper, options| mapper.instance_exec(options, &block) }
  @concerns[name] = callable
end

def concerns(*args)
  options = args.extract_options!
  args.flatten.each do |name|
    if concern = @concerns[name]
      concern.call(self, options)
    else
      raise ArgumentError, "No concern named #{name} was found!"
    end
  end
end
```

trails (`packages/actionpack/src/action-dispatch/routing/mapper.ts`, ~:1190-1200)
has `concern(name, callable)` and an invented `useConcerns(...names)` that:

- silently skips an unknown name (`if (cb) cb(this)`) where Rails raises
  `ArgumentError`,
- takes no options hash and does not pass `options` to the callable,
- does not flatten nested arrays of names.

The public DSL method `concerns` does not exist. `parity:api` still counts
`Concerns#concerns` as matched, because a private field
`private concerns: Map<string, ConcernCallback>` (`mapper.ts:657`) has the same
name, so the method-axis figure hides the gap.
`parity:api:extra` lists `routing/mapper.ts — 1 novel: useConcerns`.

## Acceptance criteria

- `Mapper#concerns(...args)` mirrors `mapper.rb:2162-2171`: `extractOptions`,
  flatten, call each concern with `(this, options)`, and raise
  `ArgumentError("No concern named <name> was found!")` on an unknown name.
- `concern(name, callable?, block?)` builds the `instance_exec` lambda when no
  callable is given.
- The storage moves to Rails' ivar name (`@concerns`, spelled `_concerns` or
  similar), so the method name no longer collides with it. `useConcerns` is
  deleted and callers (including the `resources … concerns:` option path) use
  `concerns`.
- `parity:api:extra` no longer lists `useConcerns`. Tests from
  `vendor/rails/actionpack/test/dispatch/routing/concerns_test.rb` that this
  unblocks are un-skipped or ported under their Rails names.
