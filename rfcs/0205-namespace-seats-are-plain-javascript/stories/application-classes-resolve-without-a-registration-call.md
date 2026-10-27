---
title: "Application classes resolve through a scanned per-application class-path table; the register* APIs and registerConstant go"
status: ready
updated: 2026-10-27
rfc: "0205-namespace-seats-are-plain-javascript"
cluster: retire
packages:
  [
    "activerecord",
    "actionpack",
    "activejob",
    "actioncable",
    "trailties",
    "ruby-compat",
    "activesupport",
  ]
deps: []
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails finds an application class by name because every class is a constant
on `Object`, loaded by Zeitwerk. The readers are Rails' string lookups: an
association's `class_name:`, an STI `type` column, a polymorphic `_type`
column, `controller_class_for`, GlobalID locate, a serialized job's class
name. All go through `constantize`.

trails has no autoloader (`packages/trailties/CLAUDE.md` § "Trails has no
autoloader"). The finisher's boot scan
(`packages/trailties/src/application/finisher.ts`, `loadAppClasses` /
`collectAppClasses` / `loadModels`) imports every file under `app/<root>`
and hands each exported subclass of a framework base to an invented
`registerX`, which writes the global `RCLASS_CONST_TBL` through
`registerConstant`:

- `registerModel` (`packages/activerecord/src/associations.ts:100-112`)
- `registerController` (`packages/actionpack/src/action-controller/base.ts:765-784`)
- `registerJob` (`packages/activejob/src/base.ts:169-171`)
- `registerChannel` (`packages/actioncable/src/channel/base.ts:370-372`)
- `registerConnection` (`packages/actioncable/src/connection/base.ts:392-394`)

The scan also seats each subdirectory as an implicit namespace with
`registerConstant(namespace, {})`.

## Ruling

By repo-owner ruling on 2026-10-27, superseding the `registerX` ruling of
2026-10-26 (trails#9319):

- **Keep the eager boot scan.** `constantize` is synchronous, so every shape
  loads `app/` eagerly anyway. A build-time generated table would be a
  precomputed copy of the scan, plus a build step that `trails console` and a
  test run would have to remember. A `Class#subclasses` walk fails silently
  on a class not yet imported.
- **The scan fills a per-application class-path table**, with the same shape
  and reader as the generated framework tables
  (`packages/*/src/class-paths.generated.ts`, read by `generatedClass` /
  `generatedClassPath` in `packages/ruby-compat/src/classpath.ts`). The path
  comes from the file's directory under `app/<root>` and the class's name,
  which is Zeitwerk's rule. An implicit namespace is an entry in the same
  table.
- **`constantize`, `rbModName` and `rbPathToClass` read that table** after the
  framework tables, through one ruby-compat entry point. No other code writes
  it.
- **The five `registerX` APIs, `registerConstant`, `unregisterConstant` and
  `RCLASS_CONST_TBL` are deleted** once the test suites
  (`test-suites-drop-register-model-and-register-constant`) feed the same
  table by scanning their model directories, as the finisher scans
  `app/models`.

A class reaches `constantize` through a scan, never through a hand-written
call. A test that defines a class inline and expects `constantize` to find it
does so only where the Rails test calls `const_set`, through `rbModConstSet`.

## Acceptance criteria

- [ ] ruby-compat exposes one function a scan calls to add a
      `[path, class]` entry to the application table, and `generatedClass` /
      `generatedClassPath` read it after the framework tables.
- [ ] The finisher's scans call that function for each class and implicit
      namespace, and call no `registerX` and no `registerConstant`.
- [ ] `registerController`, `registerJob`, `registerChannel` and
      `registerConnection` are deleted, together with trailties' own
      `registerController` calls (`welcome-controller.ts`,
      `info-controller.ts`, `pwa-controller.ts`, `health-controller.ts`),
      which become generated framework-table entries. `registerModel` goes
      with the test-suite story, since its 385 test calls need the test scan.
- [ ] `packages/trailties/CLAUDE.md` § "Trails has no autoloader" is
      rewritten to this ruling, replacing the "A scanned app class registers
      through its package's `registerX`" paragraph, in the same PR.
- [ ] An app fixture with `app/models/admin/user.ts`,
      `app/controllers/admin/users-controller.ts` and `app/jobs/` resolves
      `constantize("Admin::User")`, a route to `admin/users`, and an STI
      subclass by its `type` column, and `rbModName` answers the qualified
      path.
- [ ] Touched test files pass; split by package if over the PR ceiling,
      filing the rest with `tasks new`.
