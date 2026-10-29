---
title: "Vendor rake 13.2.1"
status: done
updated: 2026-10-29
rfc: "0211-rake-gem-port"
cluster: port
packages: [scripts]
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#9453
claim: "2026-10-29T20:37:39Z"
assignee: "vendor-rake-13-2-1"
blocked-by: null
---

## Context

rake 13.2.1 is what `vendor/rails/v8.0.2/Gemfile.lock:455` resolves. Thor is vendored the same way (`vendor/sources.ts`, `thor` entry; `vendor/sources.lock.json`). The upstream repo is `https://github.com/ruby/rake.git`, tag `v13.2.1`, and carries `lib/` and the Minitest suite in `test/`.

## Acceptance criteria

- [ ] `vendor/sources.ts` and `vendor/sources.lock.json` gain a `rake` source at `v13.2.1` with its sha.
- [ ] `pnpm vendor:fetch` populates `vendor/rake/v13.2.1/` with `lib/` and `test/`.
- [ ] `start-worktree.sh` links it like the other sources.
