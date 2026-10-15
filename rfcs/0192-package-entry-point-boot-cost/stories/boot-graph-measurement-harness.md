---
title: "A committed boot-graph harness: loaded-vs-shipped module ratios per package, reproducible and regression-visible"
status: draft
updated: 2026-10-14
rfc: "0192-package-entry-point-boot-cost"
cluster: "measurement"
packages: []
deps: []
deps-rfc: []
est-loc: 320
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Every number in this RFC was produced by a throwaway script in a scratch
directory. The RFC's verification target ("ruby-compat's boot contribution
falls from 147 to ≤60") is unauditable without a committed way to re-measure,
and the ratios silently regress the moment a new eager import lands.

The mechanism is a `node:module` `register()` resolve hook that records every
resolved URL, bucketed by owning package via the
`node_modules/@blazetrails/<pkg>/` path segment, reported on process exit.
Shipped counts come from counting `dist/**/*.js` per package.

## Acceptance criteria

- [ ] A committed script reports, for a given entry point: total resolved
      modules, and per-package loaded / shipped / ratio, sorted by loaded
- [ ] It reproduces the RFC's headline figures on the `examples/` app boot:
      **1284 total**, ruby-compat **147/147**, activerecord **251/2357**
- [ ] It can measure a bare specifier as well as an app entry
      (`@blazetrails/ruby-compat` → 139 modules)
- [ ] Timings are reported as a median of N warm runs, not a single cold run
- [ ] Runs in CI on the `examples/` app and prints the table in the job log
- [ ] A documented, committed baseline file the script diffs against
- [ ] CI **reports** the full per-package table and **fails only** when
      ruby-compat's loaded count exceeds the baseline; other packages' ratios
      are report-only
- [ ] Emits a committed **binding → owning module → in-SCC?** map for every
      barrel export of `ruby-compat`, which the Phase 2 codemods consume
- [ ] Measures the **union** of ruby-compat subpaths the `examples/` app's
      consumers need (per that map) and commits it as the RFC's ruby-compat
      target, with the derived full-app target

## Definition of done

A script that only prints a total module count does not close this story — the
per-package bucketing is the part that localises a regression to an owner.

## Verification

The script's own output on a clean checkout must match the committed baseline
with an empty diff.

## Notes

Two traps, both hit while producing the RFC's numbers:

- **`register()` is async in Node 24.** A dynamic `import()` in the same file
  as the `register()` call can complete before the hook attaches, reporting
  **0 modules**. The hook must be installed via `--import` in a separate module
  from the probe, and must report from an `exit` handler.
- **Node 24+ is required** to boot the example app at all: the framework's
  request-authority regex uses duplicate named capture groups, a `SyntaxError`
  on Node 20. Running the harness on Node 20 yields a truncated graph (1235
  modules) that looks like a successful measurement.

Perry's own "Found N module(s)" is **not** a usable proxy — it eagerly collects
lazy imports, so it over-counts relative to what Node loads.
