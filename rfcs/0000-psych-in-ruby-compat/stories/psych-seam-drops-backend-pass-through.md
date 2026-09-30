---
title: "Remove the npm parse/stringify pass-through from the Psych seam's public surface"
status: draft
updated: 2026-09-29
rfc: "0000-psych-in-ruby-compat"
cluster: fidelity
packages: ["ruby-compat"]
deps:
  [
    "yaml-column-safe-coder-through-psych",
    "schema-cache-dump-and-load-through-psych",
    "with-yaml-fallback-through-yaml-dump",
    "debug-helper-through-object-to-yaml",
    "encrypted-configuration-deserialize-through-psych-unsafe-load",
    "i18n-load-yml-through-psych-unsafe-load-file",
    "delete-attribute-set-yaml-codec",
    "configuration-file-parse-through-psych-unsafe-load",
    "xml-mini-parsing-yaml-entry-is-async",
  ]
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC Design §4. `move-activesupport-yaml-into-ruby-compat-psych` left the npm backend's `parse` /
`stringify` reachable through `ruby-compat/src/psych-adapter.ts` so that
unconverged consumers kept working. Once every consumer calls a Psych name,
the pass-through is surface with no caller (README rule 1).

## Acceptance criteria

- [ ] `grep -rn "psych-adapter" packages/*/src` outside ruby-compat and the
      website registration finds nothing, and the pass-through exports are
      deleted (the adapter interface stays module-internal to Psych).
- [ ] The README table rows for them are removed, and
      `parity:api:extra:gate` passes.

## Verification

`pnpm build && pnpm vitest run packages/ruby-compat/src/psych*.test.ts`.
