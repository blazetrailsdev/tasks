---
title: "Thor::Actions#apply re-evaluates a URL template's module body on every apply"
status: draft
updated: 2026-10-04
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Thor::Actions#apply` (`vendor/thor/v1.3.2/lib/thor/actions.rb:224-231`) reads the template source
and `instance_eval`s it on every call, so applying the same template twice runs its whole body
twice.

trails' port (`packages/trailties/src/thor/actions.ts`, `apply`, trails#8505) imports the template
as a module. The local arm appends a `?<n>` query from the module-level `applied` counter, so each
apply re-reads the file. The URI arm imports `data:text/javascript,<source>`, and `import()` caches
by specifier: a second apply of a URL whose source is byte-identical reuses the module, so its
top-level statements run once and only the default export runs again.

## Acceptance criteria

- [ ] A second `apply` of a URL template with identical source re-evaluates the module body, the
      way the local arm does (the same counter reaching the `data:` specifier is enough).
- [ ] A `.trails.test.ts` case applies one URL twice and asserts a top-level side effect ran twice.
