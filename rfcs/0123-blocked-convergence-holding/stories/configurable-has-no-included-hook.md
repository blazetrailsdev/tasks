---
title: "ActiveSupport::Configurable is a Concern but has no included hook, so every site spells it twice"
status: draft
updated: 2026-09-07
rfc: "0123-blocked-convergence-holding"
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

`ActiveSupport::Configurable` is a Concern
(`vendor/rails/activesupport/lib/active_support/configurable.rb:11`,
`extend ActiveSupport::Concern`), so one Ruby statement —
`include ActiveSupport::Configurable`
(`vendor/rails/actionpack/lib/abstract_controller/base.rb:50`) — installs BOTH
halves: the instance `config` (`configurable.rb:104-106`) and the
`ClassMethods` module carrying `config` / `configure` / `config_accessor`
(`configurable.rb:20-44,108`), which `Concern.append_features` extends onto the
including class (`activesupport/lib/active_support/concern.rb:135-138`).

`packages/activesupport/src/configurable.ts` exports `Configurable` as a
namespace with a `ClassMethods` sub-namespace and no `[included]` hook, so
every include site has to spell the Concern twice:

```ts
include(AbstractController, Configurable);
extend(AbstractController, Configurable.ClassMethods);
```

(`packages/actionpack/src/abstract-controller/base.ts`, added by PR #7590), and
`packages/activesupport/src/configurable.test.ts:6-9` hand-assigns all three
class members plus the instance one onto its test double. trails already has
the idiom for this — `included` from `@blazetrails/ruby-compat`, the
symbol-keyed hook `include()` fires (`ruby-compat/src/include.ts`), which is
how `ActiveModel::API` ports its own `included do` block
(`packages/activemodel/src/api.ts`).

The second half Rails' Concern carries and trails does not port at all is
`ClassMethods#inherited` (`configurable.rb:130-134`), which resets `@_config`
on each subclass. trails substitutes an own-property check inside
`ClassMethods.config`; that reaches the same result, but it is a second
mechanism rather than the Rails one, and it should be recorded as such or
converged.

## Converged shape

`Configurable` grows an `[included]` hook that extends `ClassMethods` onto the
base, so `include(klass, Configurable)` is the whole statement and mirrors
`include ActiveSupport::Configurable` one-for-one. The two-statement sites
collapse to one, and the test double includes rather than hand-assigns.

Note `converge-config-accessor-privacy` separately covers
`private :config_accessor` (`configurable.rb:127`) — do not duplicate it here.

## Acceptance criteria

- [ ] `Configurable` carries an `[included]` hook that installs `ClassMethods`;
      `include(klass, Configurable)` alone gives a class `config`, `configure`,
      `configAccessor` and the instance `config`.
- [ ] `abstract-controller/base.ts` and `configurable.test.ts` use the single
      statement; no site hand-assigns `Configurable.ClassMethods.*`.
- [ ] The `inherited` gap (`configurable.rb:130-134`) is either ported or
      carries a receipt at `ClassMethods.config` naming it.
