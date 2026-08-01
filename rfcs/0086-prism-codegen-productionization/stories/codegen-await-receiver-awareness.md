---
title: "Make await insertion receiver-aware, not name-only"
status: done
updated: 2026-08-01
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 5822
claim: "2026-08-01T19:33:02Z"
assignee: "codegen-await-receiver-awareness"
blocked-by: null
closed-reason: null
---

## Context

`crossFileAsyncNames` (`scripts/prism-codegen/async-source.ts`, added in PR 5814) is receiver-blind: it awaits a call by NAME whenever exactly one port
file defines that name async and Rails `def`s it somewhere in `TARGET_FILES`.
That is deliberately conservative on ambiguity across PORT files, but it does
not distinguish two different Rails methods that share a name across different
Rails files, nor a call on an unrelated receiver (`x.result()`, `x.missing()`
— both currently in the persistence.rb async set). Today the blast radius is
limited: `await` on a non-promise is a no-op in JS, and the scorer's skeleton
tokens ignore `await`, which is why the score is insensitive.

It becomes real once codegen output is applied (see `codegen-apply-scaffolding`)
— an await inside a hot sync path is a behavioural change.

## Acceptance criteria

- Await decisions consult receiver information where the generated AST has it
  (self-calls vs. calls on a local/param), rather than name alone.
- Names reachable only through an unrelated receiver stop being awaited.
- `pnpm codegen:score` matched count does not regress; tests cover a self-call
  awaited and a same-named call on an unrelated local left bare.
