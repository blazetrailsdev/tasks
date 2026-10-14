---
title: "actionpack: migrate its 219 ruby-compat barrel imports to subpaths"
status: draft
updated: 2026-10-13
rfc: "0192-package-entry-point-boot-cost"
cluster: "findings"
packages: ["actionpack", "ruby-compat"]
deps: ["ruby-compat-wildcard-subpath-export", "boot-graph-measurement-harness"]
deps-rfc: []
est-loc: 240
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`packages/actionpack/src` has **219** `from "@blazetrails/ruby-compat"` barrel
imports. Each one costs the importing module the full 139-module barrel instead
of the ~54-module core (or less for a thin leaf such as `name-error`, which is
5 modules).

This is one batch of the per-consumer migration in the RFC's Phase 2. It is
mechanical: for each barrel import, replace it with the subpath that actually
owns the binding. Behaviour-preserving by construction — the barrel is a pure
re-export hub.

## Acceptance criteria

- [ ] `grep -r 'from "@blazetrails/ruby-compat"' packages/actionpack/src` returns **0**
- [ ] Every replaced import names the subpath the harness's binding map gives
      for that binding; no import is rewritten to a different binding
- [ ] `pnpm build`, lint and the full test suite are unchanged
- [ ] The boot-graph harness reports the before/after module delta for this
      package in the PR body, and ruby-compat's loaded count does not rise
      above the pre-batch baseline

## Definition of done

A re-export shim inside `actionpack` that forwards to the barrel does not close this
story — it relocates the cost rather than removing it.

## Verification

```bash
grep -rc 'from "@blazetrails/ruby-compat"' packages/actionpack/src | grep -v ':0' ; # expect no output
pnpm build && pnpm vitest run packages/actionpack
```

## Notes

Type-only imports should become `import type`, which costs nothing at
runtime, wherever the binding is used only in a type position. That is often
the cheapest part of the win and is easy to miss.
