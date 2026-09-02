---
title: "No rails/all port, so which framework railties a booted app runs is an accident of the import graph"
status: draft
updated: 2026-09-02
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails boots the framework railties by requiring them: `rails/all.rb` requires
`active_record/railtie`, `action_controller/railtie`, `action_view/railtie`,
`active_job/railtie` and the rest (`railties/lib/rails/all.rb:5-18`), each
inside a `begin/rescue LoadError` so an app that omits a gem still boots. A
generated `config/application.rb` requires either `rails/all` or the individual
railties it wants.

trails has no counterpart. PR #7375 made `Application#initialize` run the
registered railties' initializers (`packages/trailties/src/application.ts`,
`application.rb:588-624`), but a class only reaches
`Trailtie.subclasses` when its module is evaluated, and nothing in trailties
imports the framework trailtie modules. A booted app therefore gets whichever
railties its own import graph happened to pull in — today that is activerecord,
actionpack and actionview via `@blazetrails/activerecord`'s and trailties' own
imports, and activemodel/globalid only transitively. Import order is also what
decides initializer order, since the activesupport registry has no `before:`
(see [[activesupport-trailtie-initializer-drops-before-after-options]]).

Verified at the seam: a test that imports `@blazetrails/activerecord` sees 19
framework initializers run; one that imports nothing sees only the two
registered by trailties' own `active-support.ts`.

## Converged shape

`packages/trailties/src/all.ts`, mirroring `railties/lib/rails/all.rb`: import
each framework's trailtie module for its side effect, each guarded the way
Ruby's `rescue LoadError` guards it (a dynamic `import()` in a `try`, since a
static ESM import of an absent optional dependency is a hard failure). The
generated `config/application.ts` template
(`packages/trailties/src/generators/`) then imports it, so which railties a
booted app has is a statement in the app, not an accident of the module graph.

## Acceptance criteria

- [ ] `trailties/src/all.ts` loads the framework trailtie modules and a missing
      optional package does not break the boot.
- [ ] A generated app's `config/application.ts` imports it.
- [ ] A test boots an app that imports only `all.ts` and asserts every
      framework railtie's initializers ran.
