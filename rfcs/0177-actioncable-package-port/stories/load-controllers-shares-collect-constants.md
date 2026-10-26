---
title: "App controllers register through registerController, like registerModel/registerJob/registerChannel"
status: draft
updated: 2026-10-26
rfc: "0177-actioncable-package-port"
cluster: null
packages: [actionpack, trailties]
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

trails#9319 moved `loadJobs` and `loadChannels` (`packages/trailties/src/application/finisher.ts`) onto `loadAppClasses` / `collectAppClasses`. These import every `.ts`/`.js` file under `app/<root>` and keep each exported subclass of a base class. Each class is seated through a per-package registration function beside the base: `registerJob` (`packages/activejob/src/base.ts`), `registerChannel` (`packages/actioncable/src/channel/base.ts`) and `registerConnection` (`packages/actioncable/src/connection/base.ts`), all copies of `registerModel` (`packages/activerecord/src/associations.ts:98`). By repo-owner ruling (2026-10-26), controllers follow the same pattern (see `claude-md-register-x-over-eager-load`).

`loadControllers` / `collectControllers` are the remaining exception:

- they import only `*[-_]controller.(ts|js)` files;
- they take any export whose name ends in `Controller`, instead of checking `ActionController::Base`;
- they key a finisher-private `controllerConstants` map by the underscored path (`admin/users`) and never seat a constant.

The scan then calls `defineController` on each class. Zeitwerk eager-loads every file under `app/controllers`, `concerns/` included (`railties/lib/rails/application/finisher.rb`, `eager_load!`).

## Acceptance criteria

- [ ] actionpack exports `registerController` beside `ActionController::Base`, with the `registerModel` shape: `(klass)` / `(name, klass)` / `(klasses[])` overloads, an `rbClassInheritedP` check against `ActionController::Base` raising `ArgumentError`, seating under `klass.name` plus `rbModName`, and `@noRailsEquivalent PERMANENT` citing trailties CLAUDE.md § "Trails has no autoloader".
- [ ] `loadControllers` goes through `loadAppClasses(paths, "controllers", ActionController.Base)` and registers each class with `registerController`, using a `Admin::` prefix for a nested directory. `collectControllers` is deleted.
- [ ] Route dispatch still finds controllers by their `admin/users` key. That key is either derived from the registered constant or looked up through `"Admin::UsersController".safe_constantize`, as Rails' `ActionDispatch::Request#controller_class_for` does (`actionpack/lib/action_dispatch/http/request.rb`). The finisher-private `controllerConstants` map goes away if nothing else reads it.
- [ ] Tests cover a nested controller, a `concerns/` file and a non-controller export under `app/controllers`.
