---
title: "Prefer native Temporal over the polyfill"
status: draft
updated: 2026-08-11
rfc: "0100-package-size-and-publish-shape"
cluster: null
packages: ["date"]
deps: []
deps-rfc: []
est-loc: 120
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`@js-temporal/polyfill` is the single largest contributor to an app's bundle —
**126,894 B**, plus its `jsbi` dependency at 27,820 B, for **154,714 B = 8.1%**
of the 1,904,049 B minified baseline. Installed, it is 2.84 MB + 0.56 MB of the
44.77 MB closure, and it is the largest external dependency by a wide margin
(the other two, `bcryptjs` and `tinyglobby`, are 0.11 MB and 0.18 MB).

It is a hard, non-optional dependency of `@blazetrails/date`
(`packages/date/package.json`, `"@js-temporal/polyfill": "^0.5.1"`), which
activerecord depends on transitively through several paths.

`Temporal` is shipping natively — this repo already runs on Node v24.16.0.
Every consumer on a runtime with native `Temporal` pays 154 KB of bundle and
3.4 MB of install for a polyfill they do not execute.

The shape to investigate is a runtime preference
(`globalThis.Temporal ?? polyfill`) and/or conditional exports, so modern
runtimes drop the polyfill entirely while older ones keep working. Note that a
naive `globalThis.Temporal ?? await import(...)` does **not** shrink a bundle by
itself — the static specifier is still followed — so this needs the same care as
`lazy-adapter-driver-resolution`, and the two stories should not fight each
other.

## Acceptance criteria

1. Establish and record which runtimes trails supports and which of them have
   native `Temporal` — this decides whether the polyfill can become optional at
   all.
2. On a runtime with native `Temporal`, the polyfill is not in the bundle:
   verified by `esbuild --metafile` showing no `@js-temporal/polyfill` or
   `jsbi` input. Target: ≥150 KB off the baseline.
3. On a runtime without it, behavior is identical — the full `@blazetrails/date`
   suite passes against both the native and the polyfill path.
4. If the answer is that the polyfill must stay unconditional, `block` this
   story with the specific reason rather than closing it with a justification.
5. Before/after bundle and closure numbers in the PR body.
