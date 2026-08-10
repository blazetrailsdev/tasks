---
title: "extract-ts-api.ts dispatches worker extraction before its own top-level consts initialize"
status: draft
updated: 2026-08-10
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/api-compare/extract-ts-api.ts:183` dispatches the entire extraction
from a `!isMainThread` block placed near the TOP of the module:

```ts
if (!isMainThread && parentPort) {
  const { package: pkgName, srcDir } = workerData as WorkerInput;
  const out: WorkerOutput = extractPackage(pkgName, srcDir);
  parentPort.postMessage(out);
}
```

Function declarations hoist, so `extractPackage` and everything it reaches are
callable there — but a `const` declared further down the file is still in its
temporal dead zone. In a worker thread the whole extraction therefore runs
against a module whose later top-level bindings do not exist yet, and any
reader that touches one dies with
`ReferenceError: Cannot access 'X' before initialization`.

This is not hypothetical and not new. The file already documents it twice, and
two consts have already been relocated up to the import block specifically to
dodge it:

- `fileHasMissingRailsCallTag`, explained at `extract-ts-api.ts:1584`
- `TAGS_ALLOWED_AFTER_NO_RAILS_EQUIVALENT`, explained at
  `extract-ts-api.ts:163`

PR #6316 hit it a third time: a four-entry `DESCRIPTOR_ESCAPES` lookup table
declared immediately above its only reader, `escapeDescriptorText` (~line 2853),
threw on the first `pnpm api:compare --calls`. It was worked around by dropping
the table and computing the escape arithmetically
(`` `%${c.charCodeAt(0).toString(16).toUpperCase()}` ``) — which is a worse
expression of the intent than the table was, chosen only to avoid a module-level
binding.

The trap has a bad shape for a reviewer, too: it is invisible to `tsc`, invisible
to `pnpm lint`, and invisible to the vitest suite, because every test imports the
module on the MAIN thread where the guard is false and module evaluation
completes normally. It only appears on a real extraction run, and only for
whoever happens to add the next const.

## Converged shape

Move the `!isMainThread && parentPort` dispatch block to the BOTTOM of the
module, beside the existing main-thread guard at `extract-ts-api.ts:3277`:

```ts
// Worker threads dispatch via the early `!isMainThread` block above
if (isMainThread && …) void main();
```

Both entry points then run after the module body has fully evaluated, no
top-level binding is ever in TDZ, and a const can live next to its reader like
it does everywhere else in the repo. The two relocated consts above can move
back down beside their readers, and their explanatory comments delete.

Check `extract-ts-api-worker.mjs` while doing it: its bootstrap registers tsx and
then imports this module expecting the side-effecting guard to fire on load, so
the dispatch must stay a top-level side effect — just a LATER one. Moving it does
not change that contract.

## Acceptance criteria

1. The `!isMainThread` dispatch block runs at the end of module evaluation, not
   the start; `pnpm api:compare --calls` and `API_COMPARE_FORCE=1
pnpm api:compare --calls` both produce byte-identical output to before.
2. `fileHasMissingRailsCallTag` and `TAGS_ALLOWED_AFTER_NO_RAILS_EQUIVALENT`
   move back beside their readers, and the two TDZ comments
   (`extract-ts-api.ts:163`, `:1584`) are deleted rather than reworded — they
   document a hazard that no longer exists.
3. A regression test that fails on the current ordering: a const declared at the
   bottom of the module, read during a real worker extraction. A main-thread
   import cannot cover this, so the test has to spawn the worker the way
   `extract-ts-api-worker.mjs` does.
4. The `DESCRIPTOR_ESCAPES` table from PR #6316 is restored as a plain const map
   in place of the charCode arithmetic, as the proof the hazard is gone.
