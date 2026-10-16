---
title: "msgpack parity: corpus format and the Ruby-free CI corpus test"
status: draft
updated: 2026-10-16
rfc: "0195-msgpack-differential-parity-rig"
cluster: rig
packages: ["msgpack"]
deps: ["msgpack-parity-structural-shrinker"]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

This is the story that makes the rig's findings permanent. A shrunk divergence
is written to `packages/msgpack/parity/corpus/` as a case holding the
value-spec and the **gem-produced bytes as the expectation**. CI then replays
the corpus with no Ruby, no gem and no randomness.

The corpus is only-grow, like the repo's other ratchets: a case is removed only
when the behaviour it pins is deliberately changed, never to make a red run
green.

## Acceptance criteria

- [ ] A corpus case records: the value-spec, the expected packed bytes as
      base64, the gem version that produced them, the factory used, the seed
      and iteration that found it, and a one-line note on what it pins.
- [ ] `packages/msgpack/src/parity-corpus.trails.test.ts` reads every corpus
      file, builds each value through `build.ts`, packs it, and asserts the
      bytes; and for each case also asserts the bytes unpack and re-pack
      identically.
- [ ] The CI test passes with no `ruby` on `PATH` and no msgpack gem installed.
- [ ] `run.ts --write` appends shrunk findings to the corpus; it never rewrites
      or reseeds existing cases.
- [ ] A case whose expectation no longer matches fails with the byte-diff
      report, not a bare base64 mismatch.
- [ ] The new `packages/msgpack/parity/` directory is registered where it needs
      to be: the package `tsconfig`, the vitest project include globs, the lint
      config, and `prettier`/`markdownlint` ignores as appropriate. Verify the
      corpus test actually runs rather than being silently outside every glob.

## Definition of done

A CI test that requires Ruby or the gem does not close this story.

## Verification

```bash
pnpm vitest run packages/msgpack/src/parity-corpus.trails.test.ts
pnpm vitest run --reporter=verbose packages/msgpack 2>&1 | grep parity-corpus
```

## Notes

A new test directory inside a package can land outside every vitest `include`
glob and pass by never running. The second verification command is there to
prove it is collected, not merely green.
