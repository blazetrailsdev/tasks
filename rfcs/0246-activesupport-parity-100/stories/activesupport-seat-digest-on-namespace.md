---
title: "activesupport: seat ActiveSupport::Digest on the namespace"
status: done
updated: 2026-11-22
rfc: "0246-activesupport-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: trails#10607
claim: "2026-11-22T22:24:08Z"
assignee: "activesupport-cache-format-version-accessor-property"
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::Digest` (`vendor/rails/v8.0.2/activesupport/lib/active_support/digest.rb`)
is autoloaded under `ActiveSupport` (`active_support.rb`). Its trails port,
`packages/activesupport/lib/digest.ts`, is never seated on the `ActiveSupport` namespace.
When an eager import pulls `cache/file-store.ts` (which imports `digest.ts`) into the
barrel graph, `scripts/api-compare/class-paths.ts --check` generates a row
`[m, "Digest", "ActiveSupport::Digest"]` and then fails with
`constGet raised NameError: uninitialized constant ActiveSupport::Digest`. This was seen
on trails#10553 (CI run 44984803510) and avoided there by dropping the eager import.

## Acceptance criteria

- [ ] `digest.ts` seats `ActiveSupport.Digest = Digest`, typed on the namespace object in `namespaces.ts`.
- [ ] `constGet(Object, "ActiveSupport::Digest")` resolves.
- [ ] `class-paths.ts --check` stays clean.
