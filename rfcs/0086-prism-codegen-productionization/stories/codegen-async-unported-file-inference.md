---
title: "Infer async for Rails files with no hand-written port"
status: done
updated: 2026-08-01
rfc: "0086-prism-codegen-productionization"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 5821
claim: "2026-08-01T19:27:00Z"
assignee: "codegen-async-unported-file-inference"
blocked-by: null
closed-reason: null
---

## Context

Remaining Honest limit in `docs/infrastructure/prism-codegen-spike.md` #3 after
PR #5814 closed the cross-file hole: a Rails file with no hand-written port at
all still falls back to fully sync output, because
`asyncMethodsForRailsFile` (`scripts/prism-codegen/async-source.ts`) seeds from
the twin `.ts` and the whole-program manifest only supplies names that Rails
`def`s somewhere in `TARGET_FILES`. For an unported file, defs get no async
marking, so `structure.ts`'s `asyncMethods.has(defName)` is false and
`expressions.ts` suppresses every `await` (the await rule is gated on
`inAsyncMethod`). That is exactly the file population codegen is most useful
for.

Options worth evaluating: infer async from what the generated body calls (a def
that calls an unambiguously-async manifest name is itself async — a fixpoint
over the generated call graph), or seed from the sibling Rails module's port.

## Acceptance criteria

- A Rails file with no twin `.ts` emits `async` defs where its body reaches a
  known-async name, instead of an all-sync file.
- The receiver-blind guard is preserved: only unambiguous manifest hits count.
- `pnpm codegen:score` matched count does not regress; a test covers an
  unported file whose def becomes async via body inference.
