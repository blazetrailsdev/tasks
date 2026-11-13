---
title: "rbCallSuper call sites are classified open-set or closed-set and their count is gated only-shrink"
status: draft
updated: 2026-11-13
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`rbCallSuper` (`packages/ruby-compat/lib/include.ts`) is the fallback for a module included by an open set of classes (CLAUDE.md § "A module included by an open set of classes binds `super` at include time"). It costs about 49 ns a call against about 38 ns for native `super` after trails#10062, and it had spread to 168 call sites outside ruby-compat, most of them in activerecord. RFC 0197's "module super inlined into includers" stories are done, so the remaining sites are either correctly open-set or were missed. trails#10062 found eight closed-set sites in one chain (`init_internals`).

Nothing stops a new site: `pnpm parity:modules` counts `new Module`, `superMethod(` and `Module` imports, not `rbCallSuper(`.

CLAUDE.md line "reads it with one property read" understates the dispatch: it is a function-property read, a keyed read on the receiver and an `apply`.

## Acceptance criteria

- Every `rbCallSuper(` site outside ruby-compat is classified against Rails' includers as open-set (stays) or closed-set (inline, per § "A module method's `super` is inlined the same way"), and each closed-set chain is filed as its own convergence story with the Rails `file:line` of every segment.
- A count of `rbCallSuper(` call sites per package is gated only-shrink against the merge-base, on the pattern of `pnpm parity:api:sends` (`scripts/parity/send-count.ts`), with no mark file.
- CLAUDE.md's description of `rbCallSuper`'s cost matches the code.
