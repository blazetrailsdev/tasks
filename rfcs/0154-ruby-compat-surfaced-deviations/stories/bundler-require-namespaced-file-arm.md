---
title: "bundler-require-namespaced-file-arm"
status: draft
updated: 2026-11-23
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/ruby-compat/lib/bundler.ts` `Bundler.require` ports `Bundler::Runtime#require`
(`vendor/ruby/v3.3.11/lib/bundler/runtime.rb:55-79`) but omits the namespaced arm at
`:69-76`: when the gem's own file is missing and the name contains `-`, Bundler requires
`dep.name.tr("-", "/")` and re-raises only a LoadError for a different path.

## Acceptance criteria

- After the entry-file miss, a dependency whose name contains `-` imports the namespaced
  specifier (`@blazetrails/foo-bar` → `@blazetrails/foo/bar`), swallowing only the miss of
  that exact module.
- A test covers both the hit and the miss.
