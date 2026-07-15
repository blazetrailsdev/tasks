---
title: "api:compare rewrites tracked rails-callback-invocations.json with formatting churn"
status: ready
updated: 2026-07-15
rfc: "0025-fidelity-verification-tooling"
cluster: null
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

Surfaced during PR 4890 (converge-cat-enum-declaration-to-array-form).

Running `pnpm api:compare` rewrites the tracked file
`eslint/rails-callback-invocations.json` with pure formatting churn — the
generator emits expanded multi-line arrays where the committed file has them
collapsed onto one line:

```diff
-    "_createRecord": ["create"],
+    "_createRecord": [
+      "create"
+    ],
```

No entries change; it is generator-vs-prettier disagreement. The file is tracked
(unlike `eslint/rails-file-structure-method-order.json`, which `.gitignore:27`
covers), so every agent who runs `api:compare` dirties their tree and risks
sweeping an unrelated ~25-line reformat into a `git add -A`. I nearly committed
it on PR 4890 and had to `git checkout --` it back.

This is the tracked-file sibling of the known method-order manifest trap
(memory: `project_api_compare_arms_method_order_autofix`).

## Acceptance criteria

- `pnpm api:compare` on a clean tree leaves `eslint/rails-callback-invocations.json`
  unmodified (`git status --porcelain` empty for it).
- Fix at the generator (run its JSON output through the repo prettier config, or
  commit the generator's native formatting once) — do not gitignore a file whose
  contents the eslint rule consumes, and do not paper over it with an autofix.
- Check the other tracked `eslint/rails-*.json` manifests for the same drift and
  fix them in the same pass.
