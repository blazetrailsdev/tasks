---
title: "Inline#compile drops ObjectSpace.define_finalizer, leaking every compiled inline template"
status: draft
updated: 2026-09-09
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

`Template::Inline#compile` in Rails does two things
(`vendor/rails/actionview/lib/action_view/template/inline.rb:16-19`):

```ruby
def compile(mod)
  super
  ObjectSpace.define_finalizer(self, Finalizer[method_name, mod])
end
```

`Finalizer` (`inline.rb:8-14`) is a proc-inside-a-proc that removes the compiled
method from the module when the template is collected:

```ruby
Finalizer = proc do |method_name, mod|
  proc do
    mod.module_eval do
      remove_possible_method method_name
    end
  end
end
```

The comment above it is explicit that the nesting is load-bearing: "This
finalizer is needed (and exactly with a proc inside another proc) otherwise
templates leak in development."

PR #7636 ported `Inline` as `packages/actionview/src/template/inline.ts` with
`compile` as the bare `super.compile(mod)` — the finalizer half is absent, so an
inline template's compiled method stays in the container's `_compiledMethods`
map forever. Every distinct inline source is a distinct `methodName()`
(`template.ts`, `_${identifierMethodName()}__${stringHash(...)}`), so a request
loop that renders inline templates grows that map without bound. That is exactly
the development-mode leak the Ruby comment names.

It shipped with no `@missingRailsCall` receipt, and that is not an oversight:
`pnpm parity:api:calls` rejects the tag, because `ObjectSpace.define_finalizer`
is not in the gate's ported-method population, so a receipt reads STALE on
arrival:

```text
call-mismatches ratchet: 1 STALE @missingRailsCall tag(s) whose call is no longer flagged.
  - actionview  template/inline.ts  compile  ObjectSpace.define_finalizer
```

A baseline row is unavailable for the same reason. So this story IS the receipt,
and closing it is the only way the omission stops being invisible.

**This is not a permanent language shortcoming.** JS gained `FinalizationRegistry`
(ES2021), which is the direct analogue of `ObjectSpace.define_finalizer`: register
the template with a held value, and the cleanup callback deletes the compiled
method from the module. Node has supported it since 14.6. The PR's own note
called the omission "no JS analogue", and that was wrong — the accurate statement
is that the analogue was not reached for in the porting slice.

Two real differences to design around rather than ignore:

- A `FinalizationRegistry` callback is not guaranteed to run, where MRI's
  finalizer runs at GC. This is a best-effort leak fix, which is what the Rails
  comment is asking for too.
- The registry must not hold a strong reference to the template, or nothing is
  ever collected — which is the JS shape of the same "proc inside another proc"
  care the Ruby comment demands. The held value is `{ methodName, mod }`, never
  `this`.

## Converged shape

`Inline#compile` calls `super.compile(mod)` and then registers the template with
a module-level `FinalizationRegistry` whose callback removes `methodName` from
`mod._compiledMethods` — the `remove_possible_method` half of `Finalizer`. Keep
the Rails names: the registry is the port of `Finalizer` and lives at
`inline.ts` alongside the class, mirroring `inline.rb:8-14`'s placement inside
`class Inline`.

Once the call is made, re-check whether a `@missingRailsCall` receipt is still
rejected; if the omission is fully gone the question is moot.

## Acceptance criteria

- `Inline#compile` registers a finalizer that removes the compiled method from
  the container, mirroring `inline.rb:16-19`.
- The registry holds no strong reference to the `Inline` instance — a test
  asserts the held value is the `{ methodName, mod }` pair, not the template.
- A test covers that the compiled method is removed when the callback fires
  (drive the registry's callback directly rather than depending on GC timing).
- `pnpm parity:api --package actionview` keeps `template/inline.rb` at 1/1, and
  `pnpm parity:api:calls` / `pnpm parity:api:extra --package actionview` report
  no new row.
