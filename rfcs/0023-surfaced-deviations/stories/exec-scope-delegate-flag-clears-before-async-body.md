---
title: "_execScope clears _delegateToModel before an async scope body settles"
status: draft
updated: 2026-07-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Relation#_execScope` (`packages/activerecord/src/relation.ts:7045-7053`)
mirrors Rails' `_exec_scope` (`relation.rb:552-558`):

```ruby
def _exec_scope(...)
  @delegate_to_model = true
  registry = model.scope_registry
  _scoping(nil, registry) { instance_exec(...) || self }
ensure
  @delegate_to_model = false
end
```

Ruby is fully synchronous here, so `ensure` runs strictly after the body.
Our `_scoping` is synchronous and clears `_delegateToModel` in a
`finally`, which fires as soon as `fn()` _returns_ — not when a returned
promise settles.

If any registered scope body is async, `_delegateToModel` (and the
nil-scope window `_scoping` installs) would close before the body
finishes, making `_isAlreadyInScope` (`relation.ts:7064`) report false
inside the tail of the body. That silently changes which branch
`spawn` takes rather than raising.

Scope bodies are sync relation-builders in normal use, so this may be
unreachable today — this story is to confirm, then either document the
invariant or guard it.

## Acceptance criteria

- Determine whether any scope body registered via `_scopes` can be async.
- If unreachable: assert the sync invariant (lint, type, or a test that
  fails on an async body) and note it at `_execScope`.
- If reachable: await the body before clearing `_delegateToModel`, with a
  regression test that fails on baseline.
