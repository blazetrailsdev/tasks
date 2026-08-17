---
title: "wide ratchet reseed reorders entries that share a rubyName"
status: ready
updated: 2026-07-30
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:calls --write` rewrites entries unrelated to the change being
reseeded. Reproduced on a clean tree at merge of #5479: with no local edits,
`--write` reorders two entries inside
`scripts/api-compare/call-mismatches-wide-exclude/activerecord-test-support/load-schema-helper.json`,
swapping the `load` and `exist?` entries that share `rubyName: "load_schema"`:

```diff
-    "call": "load",   ... "reason": "Ruby's Kernel#load evaluates schema.rb ..."
+    "call": "exist?", ... "reason": "`File.exist?(adapter_specific_schema_file)` ..."
```

The swap is deterministic and repeats on every reseed, so it is emitted order,
not a race: within a single (tsFile, rubyName) group the writer takes the live
mismatch iteration order rather than the on-disk order or a stable sort key.

This is a residual of `wide-ratchet-reseed-rewrites-unrelated-files` (0025,
done), which fixed the cross-file case; the same-method case survives.

Cost: every PR that legitimately reseeds the wide ratchet picks up unrelated
churn that the author must notice and revert by hand. On #5479 the reseed for a
real convergence (`scoping.ts` `ignore_default_scope=`) carried this file along
and it was reverted manually before pushing — an author who does not check ships
noise into the baseline diff.

## Acceptance criteria

- [ ] `lint-call-mismatches-wide.ts --write` emits a stable total order within
      each (package, tsFile, rubyName) group — sort on `call` (or another
      deterministic key) rather than iteration order.
- [ ] Running `--write` twice on a clean tree, with no intervening source
      change, produces no diff on the second run and no diff on the first.
- [ ] A regression test asserts reseed idempotence on a fixture containing two
      entries that share a `rubyName` and differ only in `call`.

## Mechanism retired — 2026-08-17

**The `call-mismatches-wide-exclude/` tree no longer exists** — RFC 0084 folded it
into `call-mismatches-exclude/`. Re-express against the merged tree.

## Re-verified 2026-08-17 (ready sweep)

Still worth confirming, but **the reproduction case is gone**: the cited file
`call-mismatches-wide-exclude/activerecord-test-support/load-schema-helper.json`
no longer exists (RFC 0084 folded the tree). Re-run `pnpm parity:api:calls --write`
on a clean tree against `call-mismatches-exclude/` and check whether same-`rubyName`
entries still reorder; if the merged writer sorts deterministically the story
closes on that evidence.
