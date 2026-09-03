---
title: "ABSTRACT_RAILTIES holds classes, not Rails' fully-qualified constant paths, so railtieName is wrong for all seven railties"
status: draft
updated: 2026-09-03
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Landed in PR #7413 (`fold-the-two-trailtie-ports-into-one`) as a receipted
deviation, and left convergeable rather than converged because the fold was
already at its LOC ceiling.

`Rails::Railtie::ABSTRACT_RAILTIES`
(`vendor/rails/railties/lib/rails/railtie.rb:142`) is an array of
FULLY-QUALIFIED constant-name strings, and `abstract_railtie?`
(`railtie.rb:172-174`) tests membership by name:

```ruby
ABSTRACT_RAILTIES = %w(Rails::Railtie Rails::Engine Rails::Application)
...
def abstract_railtie?
  ABSTRACT_RAILTIES.include?(name)
end
```

Before #7413 trails held the bare names `["Trailtie", "Engine", "Application"]`.
That was already wrong and became load-bearing-wrong once the fold landed: every
framework railtie is `Trailtie` inside its own file
(`packages/trailties/src/trailties/active-model.ts`, `active-record.ts`,
`action-view.ts`, `action-controller.ts`, `action-dispatch.ts`, `global-id.ts`,
`active-support.ts`), so a bare-name list calls all seven abstract and drops them
from `Trailtie.subclasses()`.

The shipped fix holds the three CLASSES themselves
(`packages/trailties/src/trailtie.ts:45`, `:93`), populated by an
`abstractRailtie()` marker each of `Trailtie` / `Engine` / `Application` calls in
its own static block:

```ts
export const ABSTRACT_RAILTIES: unknown[] = [];
export function abstractRailtie(klass: unknown): void { ABSTRACT_RAILTIES.push(klass); }
...
static isAbstractRailtie(): boolean { return ABSTRACT_RAILTIES.includes(this); }
```

It carries a `@noRailsEquivalent PERMANENT` receipt. That permanence token is
the part this story disputes: the receipt argues TypeScript class names carry no
namespace, which is true, but trails already has a settled idiom for exactly
that gap and it was not tried.

## Converged shape

CLAUDE.md's "Call-time constant resolution" section documents `rubyClassPath` —
"the Ruby constant path a store registers for itself"
(`packages/rack-session/src/ruby-class-path-slot.ts`, read by
`abstract/id.ts`'s `rubyClassPath` for Ruby's `self.class`,
`rack-session/lib/rack/session/abstract/id.rb:155,396`). Two stories have
already applied it — `converge-ruby-class-path-for-out-of-module-stores` and
`converge-actionpack-session-subclass-ruby-class-paths`, both done under RFC
0133.

Applied here, `ABSTRACT_RAILTIES` becomes Ruby's own array verbatim:

```ts
const ABSTRACT_RAILTIES = ["Rails::Railtie", "Rails::Engine", "Rails::Application"];

static isAbstractRailtie(): boolean {
  return ABSTRACT_RAILTIES.includes(this.rubyClassPath());
}
```

with each `Trailtie` subclass declaring its own path (`"ActiveModel::Railtie"`,
`"ActionView::Railtie"`, …). `abstractRailtie()` and the three `static {
abstractRailtie(this) }` blocks in `trailtie.ts`, `engine.ts` and
`application.ts` are then deleted, and the `@noRailsEquivalent PERMANENT`
receipt on `ABSTRACT_RAILTIES` goes with them — the constant becomes an exact
mirror of `railtie.rb:142` with no receipt at all.

This also removes the last reason `Trailtie.name` is load-bearing, and gives
`railtieName()` (`trailtie.ts`, mirroring `railtie.rb`'s
`generate_railtie_name`) a correct input: it currently underscores `this.name`
and so returns `"trailtie"` for all seven framework railties, where Rails
returns `"active_model_railtie"`, `"action_view_railtie"`, and so on. Fixing
that is in scope here since it falls out of the same declaration.

## Acceptance criteria

- [ ] `ABSTRACT_RAILTIES` is the three fully-qualified Ruby strings, byte-for-byte
      `railtie.rb:142`.
- [ ] `isAbstractRailtie()` is `ABSTRACT_RAILTIES.includes(<this class's ruby
      path>)`, mirroring `railtie.rb:172-174`.
- [ ] `abstractRailtie()` and its three `static {}` call sites are gone, and so
      is the `@noRailsEquivalent PERMANENT` receipt on `ABSTRACT_RAILTIES`.
- [ ] Each of the seven framework railties declares its Ruby constant path, and
      `railtieName()` returns Rails' value for each rather than `"trailtie"`.
- [ ] `Trailtie.subclasses()` still excludes only `Trailtie` / `Engine` /
      `Application`, and the existing `RailtieTest` cases keep their names.
- [ ] `pnpm parity:api:extra:gate` does not increase for trailties.
