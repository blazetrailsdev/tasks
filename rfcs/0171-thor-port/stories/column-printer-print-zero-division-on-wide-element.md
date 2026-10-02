---
title: "ColumnPrinter#print raises ZeroDivisionError for an element wider than the terminal"
status: draft
updated: 2026-10-02
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
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

`Thor::Shell::ColumnPrinter#print` (`vendor/thor/v1.3.2/lib/thor/shell/column_printer.rb:19`)
computes `(index + 1) % (Terminal.terminal_width / colwidth)` with Ruby Integer
division and modulo. When one element is wider than the terminal,
`Terminal.terminal_width / colwidth` is `0` and `Integer#%` raises
`ZeroDivisionError` ("divided by 0").

`packages/trailties/src/thor/shell/column-printer.ts` ports the expression as
`(index + 1) % Math.floor(Terminal.terminalWidth() / colwidth) === 0`. In JS
`n % 0` is `NaN`, so the arm reads false and the element is written with
`printf` and no newline where Thor raises. ruby-compat has no `Integer#%` /
`Integer#/` port (`packages/ruby-compat/src/numeric.ts` exports `anybits`,
`round`, `toI` only); `ZeroDivisionError` itself is exported from
`packages/ruby-compat/src/rational.ts`.

## Acceptance criteria

- [ ] ruby-compat ports `Integer#/` and `Integer#%` (`vendor/ruby/v3.3.11/numeric.c`
      `fix_divide` / `fix_mod`), raising `ZeroDivisionError` for a zero divisor.
- [ ] `ColumnPrinter#print` uses them, and a `.trails.test.ts` case asserts
      `printInColumns` raises `ZeroDivisionError` for an element wider than
      `THOR_COLUMNS`.
