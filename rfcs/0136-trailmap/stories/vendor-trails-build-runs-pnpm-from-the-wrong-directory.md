---
title: "vendor-trails.sh runs pnpm -C from trailmap, so pnpm's version switch fails"
status: ready
updated: 2026-10-30
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 5
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Problem

`scripts/vendor-trails.sh` rebuilds trails with `pnpm -C "$TRAILS" build`
while trailmap is the current directory. pnpm picks its version from the
current directory's `packageManager`, and trails pins `pnpm@12.3.4`. The
version switch then fails:

    ERROR  Command failed with exit code 1: pnpm add pnpm@12.3.4 ... --config.node-linker=hoisted

The trailmap#95 bump worked only after the script was run with the trails
checkout as the current directory.

## Shape

The build step runs inside the checkout, `( cd "$TRAILS" && pnpm build )`,
as the pack step already does with `cd "$TRAILS/packages/$p"`.

## Acceptance criteria

- `scripts/vendor-trails.sh <trails> <ref>` run from the trailmap root
  completes.
