---
title: "actionpack: an application has to name its actions underscored; the method's camelCase spelling should resolve"
status: in-progress
updated: 2026-10-07
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 200
priority: 1
pr: trails#8640
claim: "2026-10-07T15:59:57Z"
assignee: "routes-and-tests-accept-the-method-spelling-of-an-action"
blocked-by: null
closed-reason: null
---

## Context

Owner-directed, 2026-10-07, on seeing trailmap#41: an application should not have to write
underscored action names. A controller method is `nextBundle()`; the application wants to route to
it as `to: "stories#nextBundle"` and test it as `get("nextBundle")`.

Since trails#8573 (2026-10-06) that fails with "The action 'nextBundle' could not be found".
`AbstractController.actionMethods` (`packages/actionpack/src/abstract-controller/base.ts:220-238`)
answers Rails names by underscoring each method name and caches name -> JS method; `process`
(`:271-285`) is `this._actionName = String(action)` with no normalization, as
`vendor/rails/v8.0.2/actionpack/lib/abstract_controller/base.rb:152-162` is; and
`_findActionName` looks the given string up as-is. That PR removed, on purpose, the
`underscore(String(action))` that `process` used to do, as an arm Rails does not have
(`process-normalizes-camelcase-action-names-callers-not-swept`, RFC 0162, done), and swept about
560 call sites to the Rails spelling.

So the two requirements pull against each other, and this story is to reconcile them, not to
revert that one:

- Fidelity: `action_name` is the Rails name (`next_bundle`), because template lookup, `only:` /
  `except:` lists, `render action:`, log lines and the ported Rails tests all use it, and `process`
  does no spelling conversion.
- Ergonomics (the owner's): where an APPLICATION names one of its own methods, the method's
  spelling works.

What trailmap had to do meanwhile, which is the finding: four route targets and their tests were
changed to `next_bundle`, `in_progress`, `record_spawn`, `status_set`, and CLAUDE.md gained a
paragraph explaining why camelCase "everywhere" has this exception.

## Options to decide between

1. **Resolve the spelling at the boundary the application writes, not in `process`.** The routing
   mapper is where `to: "c#a"` and `action:` are read (`packages/actionpack/src/action-dispatch/routing/mapper.ts`);
   it would store the Rails name for a method-spelled action. `ActionController::TestCase#process`
   likewise. `process` and `action_name` stay as Rails has them. Cost: a conversion at two
   call-facing sites, each needing a receipt, and `docs/ruby-ts-conventions.md` saying action names
   may be given in either spelling.
2. **Make the lookup accept both.** `_findActionName` / `methodForAction` resolve a method-spelled
   name through the same cache, and `process` records the Rails name it resolved to. One site, but
   it is on the dispatch path #8573 cleared.
3. **Keep one spelling and say so.** No code; the conventions doc and `trails new`'s generated
   routes state that actions are named in Rails' form. This is today, and is what the owner has
   asked to change.

Whichever is taken has to answer `foo-bar`: the old normalization also turned `-` into `_`, which
`action_missing` controllers saw.

## Acceptance criteria

- [ ] A route `to: "stories#nextBundle"` and one `to: "stories#next_bundle"` both reach `StoriesController#nextBundle`, and `action_name` is `next_bundle` in both.
- [ ] `ActionController::TestCase`'s `get("nextBundle")` and `get("next_bundle")` both dispatch.
- [ ] The Rails-named tests swept in trails#8573 are untouched and pass.
- [ ] `docs/ruby-ts-conventions.md` states the rule; the deviation carries its receipt.
- [ ] trailmap can restore camelCase route targets and delete the CLAUDE.md paragraph.
