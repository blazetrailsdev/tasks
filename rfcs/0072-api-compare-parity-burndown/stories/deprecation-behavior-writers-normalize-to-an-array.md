---
title: "Deprecation#behavior=/disallowed_behavior= normalize to an Array of callables on write"
status: done
updated: 2026-08-09
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: 6279
claim: "2026-08-09T13:39:33Z"
assignee: "check-constraint-name-raises-argumenterror-not-keyerror"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while porting `Deprecation::Deprecators` in PR #6256.

Rails' `behavior=` / `disallowed_behavior=` **normalize on write**
(`activesupport/lib/active_support/deprecation/behaviors.rb:111-121`):

```ruby
def behavior=(behavior)
  @behavior = Array(behavior).map { |b| DEFAULT_BEHAVIORS[b] || arity_coerce(b) }
end
```

and the readers default on read (`behaviors.rb:73-81`):

```ruby
def behavior
  @behavior ||= [DEFAULT_BEHAVIORS[:stderr]]
end

def disallowed_behavior
  @disallowed_behavior ||= [DEFAULT_BEHAVIORS[:raise]]
end
```

So both are **always an Array of callables** — which is why `warn` can write
the bare `behavior.each { |b| b.call(full_message, callstack, self) }`
(`deprecation/reporting.rb:23-27`), and why `deprecators_test.rb:56` asserts
`assert_equal [callback], deprecator.behavior` after setting a single proc.

trails stores whatever was assigned, raw:

```ts
behavior: DeprecationBehavior | DeprecationBehavior[] | ((...args) => void) | null = "stderr";
disallowedBehavior: DeprecationBehavior | ((...args) => void) | null = "raise";
```

(`packages/activesupport/src/deprecation.ts`), then re-derives the Array at
every call site — `warn` does
`Array.isArray(this.behavior) ? this.behavior : [this.behavior]` twice, and
`_runBehaviors` re-dispatches the `:stderr` / `:raise` symbol arms through a
`switch` on every warning instead of resolving them once through
`DEFAULT_BEHAVIORS`.

Consequences: `disallowedBehavior` cannot hold an Array at all (Rails' takes
one), the `arity_coerce` validation (`behaviors.rb:124-137`) has no port, and
`deprecators.test.ts`'s `#behavior= applies to each deprecator` asserts
`toBe(callback)` where Rails asserts `[callback]`.

## Converged shape

Back both with private fields and give them Rails' accessor pair: a `setBehavior`
/ `setDisallowedBehavior` writer that does `Array(behavior).map { DEFAULT_BEHAVIORS[b] || arityCoerce(b) }`,
and a reader that memoizes the `[stderr]` / `[raise]` default. Port
`DEFAULT_BEHAVIORS` (`behaviors.rb:13-63`) as the symbol → callable table it is,
so `_runBehaviors`' `switch` disappears and `warn` becomes Rails' bare
`behavior.each`. Update the two `deprecators.test.ts` / `deprecation.test.ts`
assertions to Rails' array form.

## Acceptance criteria

- [ ] `behavior` / `disallowedBehavior` always read back as an Array of
      callables (`behaviors.rb:73-81`).
- [ ] The writers normalize through `DEFAULT_BEHAVIORS` + `arityCoerce`
      (`behaviors.rb:111-121`, `:124-137`).
- [ ] `warn` spells Rails' bare `behavior.each` (`reporting.rb:23-27`); the
      per-call `switch` in `_runBehaviors` is gone.
- [ ] `#behavior= applies to each deprecator` asserts `[callback]`, as
      `deprecators_test.rb:52-57` does.
