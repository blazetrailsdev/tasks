---
title: "Tempfile drops its options on the way to Dir::Tmpname.create and File.open"
status: draft
updated: 2026-09-26
rfc: "0154-ruby-compat-surfaced-deviations"
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

`Tempfile#initialize` (`vendor/ruby/lib/tempfile.rb:150-161`) passes its `**options` to `Dir::Tmpname.create(basename, tmpdir, **options)`. In the block it sets `opts[:perm] = 0600` and opens with `File.open(tmpname, @mode, **opts)`, then stores `@opts = opts.freeze`. It also takes `mode:`, which it ORs into `RDWR|CREAT|EXCL`.

trails#8118 gave `createTmpname` (`packages/ruby-compat/src/dir.ts`) Ruby's `max_try:` / `**opts` and made it yield `opts`. `openExclusive` (`packages/ruby-compat/src/tempfile.ts`) still passes `{}` and ignores the yielded `opts`. It hard-codes `"wx+"` with `perm: 0o600` and applies `encoding` separately. So a caller's `max_try:`, `mode:` or other `File.open` options never reach the create or the open.

## Converged shape

- `openExclusive` / `Tempfile.new` / `Tempfile.create` forward their options through `createTmpname`.
- They open with the yielded `opts` plus `perm: 0o600`, and fold `mode:` into the open flags, as `tempfile.rb:154,157-160` (and `:440-445` for `create`) do.

## Acceptance criteria

- [ ] `Tempfile` options reach `Dir::Tmpname.create` and `File.open` as in `tempfile.rb:150-161`.
- [ ] A trails test pins `max_try:` being honored and `mode:` being folded in.
