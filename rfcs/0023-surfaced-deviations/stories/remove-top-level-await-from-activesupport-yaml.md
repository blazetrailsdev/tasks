---
title: "Remove the top-level await from activesupport/yaml so CJS and IIFE consumers can load it"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Not a Rails-fidelity divergence: yaml.ts has no Rails counterpart (Psych is stdlib); the story is about CJS/IIFE bundle compatibility for the optional npm dep."
---

## Context

`packages/activesupport/src/yaml.ts:11` resolves the optional `yaml` package with a
**top-level await**:

```ts
const yaml = await import("yaml").catch(() => {
  /* throwing stubs */
});
export const { parse, stringify } = yaml;
```

Top-level await cannot be represented in a CJS or IIFE bundle, so every non-ESM
consumer of the module graph breaks:

- `packages/website/src/stubs/yaml-stub.ts` exists solely to shim it out of the
  Rollup IIFE build.
- The nightly stats sync died on it for a full day (PR #6133): tsx loaded
  `scripts/sync-stats/sync.ts` as CJS — the repo root declares no `"type"` — and
  esbuild aborted with `Top-level await is currently not supported with the "cjs"
output format`. #6133 fixed the consumer with a `"type": "module"` marker, but
  the landmine is still armed for the next CJS/IIFE consumer, and neither
  `tsc` nor vitest (both ESM) can see it.

Rails has no counterpart to this file at all — Psych is stdlib, so
`require "yaml"` in `activerecord/lib/active_record/coders/yaml_column.rb:3` and
`activerecord/lib/active_record.rb:31` cannot fail. The whole construct exists
because `yaml` is an npm `optionalDependency` here. The current shape came from PR
6078 (#6078), which correctly removed a static `export … from "yaml"` (an eager
link-time edge that made every module merely _naming_ the YAML coders
unimportable) — but traded it for a top-level await.

Callers are all synchronous, which is what forces the await to the top level:

- `packages/activerecord/src/coders/yaml-column.ts` (`SafeCoder#dump` / `#load`)
- `packages/activemodel/src/attribute-set/codecs/yaml.ts` (`yamlCodec`)
- `packages/actionview/src/helpers/debug-helper.ts`

## Converged shape

Keep both properties #6078 wanted — no link-time edge, miss surfaces at the call
site like Ruby's `LoadError` from `require "yaml"` — with no top-level await.
Sketch: `parse`/`stringify` stay synchronous exported functions that consult a
module-level binding populated on first use, with the resolution failure raised
from the call site rather than from module evaluation. Getting a _synchronous_
first resolution in ESM is the crux and is what needs designing; if it proves
genuinely impossible, the fallback is to make the yaml entry point's async-ness
explicit and push the await into the (few) consumers rather than leaving it
implicit at module scope.

Related: `configuration-file-static-yaml-import-is-an-eager-edge` (same optional
`yaml` dependency, the other half of the eager-edge problem).

## Acceptance criteria

- No top-level await anywhere in `packages/activesupport/src/yaml.ts`.
- `packages/website/src/stubs/yaml-stub.ts` and its Rollup alias are deleted; the
  website build stays green.
- The three consumers above keep their current synchronous call shape, or are
  converted deliberately with the change justified at each call site.
- A missing `yaml` package still raises at the call site, not at import time —
  keep a test for that.
- `pnpm stats:sync --latest` still runs (it now loads as ESM, but must not
  regress).
