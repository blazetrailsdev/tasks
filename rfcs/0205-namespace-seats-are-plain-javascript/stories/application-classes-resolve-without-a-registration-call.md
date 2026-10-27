---
title: "Design: application models, controllers, jobs and channels resolve by name without a register* call"
status: draft
updated: 2026-10-27
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: design
packages: ["activerecord", "actionpack", "activejob", "actioncable", "trailties"]
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails finds an application class by name because every class is a constant
on `Object`, loaded on demand by Zeitwerk. trails has no autoloader
(CLAUDE.md § "Trails has no autoloader"), so it asks the application to call
an invented registration API that writes `RCLASS_CONST_TBL`:

- `registerModel` (`packages/activerecord/src/associations.ts:100-112`):
  14 source files, 385 test call sites
- `registerController` (`packages/actionpack/src/action-controller/base.ts:765-784`):
  6 source, 7 test
- `registerJob` (`packages/activejob/src/base.ts:169-171`),
  `registerChannel` (`packages/actioncable/src/channel/base.ts:370-372`),
  `registerConnection` (`packages/actioncable/src/connection/base.ts:392-394`)

Their readers are the Rails string lookups: `class_name:` on an association,
an STI `type` column, a polymorphic `_type` column, `controller_class_for`
(`0141/controller-class-for-constantizes-not-controller-constants-map`,
`0141/controller-constant-resolution-throws-instead-of-constantize`),
GlobalID locate, a job's serialized class name.

This is a design story: it needs a ruling from the repo owner before
implementation stories are filed. Candidate shapes:

1. **A generated application class-path table**, written by the same build
   step that precompiles templates (`trails-tsc-views build`, CLAUDE.md
   § "Templates are precompiled"), mapping each exported class under `app/`
   to its path from the file layout, which is Zeitwerk's own rule. The boot
   process imports it. No call in application code.
2. **`Class#subclasses` walk** from `Base` / `ActionController::Base` /
   `ActiveJob::Base`. Fails for a class not yet imported, and the seat is
   only written on first own write
   (§ "`Class#subclasses` is seated on a class's first own write").
3. **Keep a registration call**, renamed to nothing new. Rejected up front:
   it is the mechanism being removed.

## Acceptance criteria

- [ ] The repo owner picks a shape; the ruling is recorded in this RFC's
      README and in CLAUDE.md beside § "Trails has no autoloader".
- [ ] Implementation stories are filed with `tasks new` for: the resolver,
      each `register*` API's deletion, and the generator / template changes
      (`packages/trailties/src/generators/`), each citing the call sites
      above.
