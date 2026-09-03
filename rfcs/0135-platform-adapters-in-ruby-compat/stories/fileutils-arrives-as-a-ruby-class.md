---
title: "FileUtils arrives as a Ruby class — the one receiver already in the call-set, so the class shape proves out against live gate rows"
status: in-progress
updated: 2026-09-03
rfc: "0135-platform-adapters-in-ruby-compat"
cluster: null
packages: ["ruby-compat", "activesupport"]
deps: ["move-fs-adapter-into-ruby-compat-as-a-backend-contract"]
deps-rfc: []
est-loc: 300
priority: 3
pr: 7426
claim: "2026-09-03T01:38:58Z"
assignee: "fileutils-arrives-as-a-ruby-class"
blocked-by: null
closed-reason: null
---

## Context

The proof-of-shape story for RFC 0135, chosen because **`FileUtils` is the one
receiver that needs no change to `CORE_CLASS_RECEIVERS`**
(`scripts/api-compare/extract-ruby-api.rb:3008-3011` lists `File Dir IO Module
Class Proc Kernel Marshal ObjectSpace GC Process Thread Mutex Encoding Random
Signal Struct Method` — `FileUtils` is absent). Its calls are in the Ruby
call-set today and are being missed silently, so this story lands against live
gate rows and settles the class shape, the receipt shape and the mark movement
before anything touches the exemption list.

Rails' usage, measured across `vendor/rails/**/*.rb` on 2026-09-02:
`rm_rf` 62, `mkdir_p` 42, `touch` 32, `cd` 25, `rm_f` 15, `rm` 14, `rm_r` 7,
`mv` 7, `cp_r` 7, `remove_dir` 4, `cp` 3, `mkdir` 2.

Names come from `rubyMethodToTs` (`scripts/parity/conventions.ts`) and are not
a design decision — verified 2026-09-02: `mkdir_p` → `mkdirP`, `rm_rf` → `rmRf`,
`rm_f` → `rmF`, `cp_r` → `cpR`, `touch`/`cd`/`mv`/`cp` unchanged. If a name you
want is not what that function produces, the name is the bug.

Note `fs-adapter.ts` already carries `rm` and `rmF` on its Node wrapper
(`fs-adapter.ts:291-300`) — the Ruby shape has been leaking in ad hoc and
unowned. Those two are this class's first members, moved rather than written.

`FileUtils` is a **class with static members** in `ruby-compat`, backed by the
fs backend contract. It carries a `@noRailsEquivalent PERMANENT` receipt citing
`vendor/ruby` in the shape `string-io.ts:13-16` uses, which is what keeps
ruby-compat's pinned `novel: 0` intact; `total` in
`scripts/api-compare/extra-surface-mark.json:11-13` rises, exactly as it did in
PR #7365 (28→30), #7394 (30→32) and #7399 (32→33).

## Acceptance criteria

- `packages/ruby-compat/src/file-utils.ts` exports `FileUtils` with the members
  Rails actually calls in ported bodies (measure; do not port all twelve
  speculatively — RFC 0129's standing rule is members with a real call site).
- Each member carries an MRI citation and the class a `@noRailsEquivalent
PERMANENT` receipt.
- Every trails call site that was open-coding a `FileUtils` operation through
  `getFs()` now calls `FileUtils`, and `API_COMPARE_FORCE=1 pnpm parity:api
--calls` shows the credited rows — state the before/after row count in the PR
  body.
- `pnpm parity:api:extra:gate` is green; `novel` is still 0 and the `total`
  bump is the only mark change.
- No re-export shim is left behind for a later story to delete (RFC 0135's
  standing rule).
