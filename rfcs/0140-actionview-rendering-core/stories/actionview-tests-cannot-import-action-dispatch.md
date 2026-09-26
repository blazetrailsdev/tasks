---
title: "actionview-tests-cannot-import-action-dispatch"
status: done
updated: 2026-09-26
rfc: "0140-actionview-rendering-core"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8129
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/actionview/test/template/html_test.rb:10-14` ("formats returns
string for recognized MIME type when MIME does not have symbol") builds its
argument with `Mime::Type.lookup("text/foo")`. Rails' actionview suite loads
Action Dispatch through `abstract_unit`, so `Mime` is in scope there, and
`action_dispatch.rb:149-153`'s `on_load(:action_view)` has already swapped
`Template::Types` for `Mime`.

trails cannot write that test in its Rails file,
`packages/actionview/src/template/html.test.ts` (still an `it.todo`):
actionview's test files compile inside actionview's own tsconfig project
(`packages/actionview/tsconfig.json`, `include: ["src"]`), and actionpack
depends on actionview, so importing `@blazetrails/actionpack` from an
actionview test is a project-reference cycle. vitest's alias
(`vitest.config.ts`, `@blazetrails/actionpack`) would resolve it at run time;
`tsc --build` cannot.

Prior art for the split: `packages/ruby-compat/tsconfig.test.json`, a separate
composite project for `src/**/*.test.ts` that references the package's own
`tsconfig.json`.

## Acceptance criteria

- actionview's `*.test.ts` compile in a test project that may reference
  actionpack (a `tsconfig.test.json` like ruby-compat's, registered in the root
  `tsconfig.json`), without a runtime dependency cycle.
- `html.test.ts`'s `it.todo` becomes the Rails test: `Mime::Type.lookup("text/foo")`,
  `assert_nil foo.to_sym`, and `HTML.new("", foo).format` equal to `"text/foo"`.
