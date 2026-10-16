---
title: "msgpack parity: the driver, seeded generator and byte-diff report"
status: draft
updated: 2026-10-16
rfc: "0195-msgpack-differential-parity-rig"
cluster: rig
packages: ["msgpack"]
deps: ["msgpack-parity-ruby-oracle-harness"]
deps-rfc: []
est-loc: 420
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`run.ts` is the rig's entry point: it spawns the oracle once, generates
value-specs from a seed, packs each on the TS side, compares bytes, and reports
divergences in a form someone can act on.

A raw base64 mismatch is not actionable. The report must name the **byte
offset** of the first difference, the **msgpack opcode** at that offset on each
side, and the sub-spec that produced it, so a reader can tell "wrote str8 where
the gem wrote fixstr" from "wrote the wrong payload".

`generate.ts` holds the seeded generator. Determinism matters: a divergence
found at `--seed 7 --iterations 1e6` must be reproducible from that pair alone,
which rules out `Math.random` and any ambient ordering.

## Acceptance criteria

- [ ] `pnpm fuzz:msgpack` is registered in the root `package.json` and accepts
      `--seed`, `--iterations`, and `--only <family|ext-id>`.
- [ ] `generate.ts` is a seeded PRNG; the same seed and iteration count produce
      the same spec sequence across runs and machines.
- [ ] The generator biases toward boundaries — the integer family's width
      transitions, container header transitions, empty and maximum-length
      strings — rather than sampling uniformly.
- [ ] Both directions are checked per case: dump (bytes equal) and load (gem
      bytes unpack, re-pack byte-identically, and the value matches the
      oracle's canonical description).
- [ ] A divergence report names the first differing byte offset, the opcode on
      each side, both base64 payloads, and the minimal sub-spec.
- [ ] The oracle is spawned once per run and its exit or crash fails the run
      with its stderr attached.
- [ ] A non-zero exit on any divergence, so the command is usable from a script.

## Verification

```bash
pnpm fuzz:msgpack --seed 1 --iterations 1000 --only int
```

## Notes

Keep the opcode table in the reporter, not in `build.ts` — it is a debugging
aid and must not become a second implementation of the format that the rig then
tests itself against.
