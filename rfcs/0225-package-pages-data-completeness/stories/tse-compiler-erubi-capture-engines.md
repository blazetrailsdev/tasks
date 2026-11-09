---
title: "tse-compiler-erubi-capture-engines"
status: claimed
updated: 2026-11-09
rfc: "0225-package-pages-data-completeness"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-09T19:50:24Z"
assignee: "tse-compiler-erubi-capture-engines"
blocked-by: null
closed-reason: null
---

## Context

`packages/tse-compiler/lib/erubi.ts` ports `Erubi::Engine` (vendor/erubi/1.13.1/lib/erubi.rb:50-298) and `Erubi.h`, and `packages/tse-compiler/test/test.test.ts` ports 21 of the Engine-describe tests in vendor/erubi/1.13.1/test/test.rb (src comparison of `check_output`, test.rb:39-47). Left unported:

- `lib/erubi/capture_end.rb` (`CaptureEndEngine`, 58 lines) → `lib/capture-end.ts`, and `lib/erubi/capture_block.rb` (`CaptureBlockEngine`, 91 lines) → `lib/capture-block.ts`; each subclasses `Engine` and overrides `handle` / `add_text` etc. `Engine`'s constructor ends with `Object.freeze(this)` (erubi.rb:208's `freeze`), so subclass state must be set before the scan, as Ruby does.
- tests test.rb:453 ("should handle ensure option with no bufvar"), :408 ("should handle :freeze_template_literals => false option"), and the CaptureEndEngine / CaptureBlockEngine describes (test.rb:812-1223).

## Acceptance criteria

- [ ] `capture-end.ts` / `capture-block.ts` port both engines at their Rails names; `pnpm parity:api` reports erubi files 3/3.
- [ ] The remaining src-compared test.rb tests port by verbatim name into `test/test.test.ts`. The eval-only `CaptureBlockEngine` describe (test.rb:810-1000) and `CaptureBlockEngine::Buffer` are `tse-compiler-erubi-capture-block-eval-tests`.
