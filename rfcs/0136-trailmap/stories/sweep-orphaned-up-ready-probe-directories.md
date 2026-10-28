---
title: "Sweep /up/ready probe directories orphaned by a kill, gated on age"
status: done
updated: 2026-10-28
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trailmap#89
claim: "2026-10-28T13:08:18Z"
assignee: "split-the-render-pages-the-rails-way-story"
blocked-by: null
closed-reason: null
---

## Context

`ProbesController#checkCheckout` (trailmap `app/controllers/probes-controller.ts`, merged in trailmap#54) proves the tasks checkout is writable by `mkdtemp`-ing `.up-ready-XXXXXX` inside it and `rmdir`-ing it. If the process is killed between the two calls the directory stays. `git status` does not show an empty directory, so the leftovers are invisible, and `/up/ready` is polled every minute by RFC 0143's tier 1.

A failed `rmdir` is already a red check naming the leftover. The kill case is not handled. An unconditional sweep at the start of each probe would delete a concurrent probe's directory and turn that probe red; a sweep gated on age would not.

## Acceptance criteria

- [ ] `checkCheckout` removes `.up-ready-*` directories in the checkout older than a few minutes
- [ ] A directory younger than the gate is left alone, so two concurrent probes cannot fail each other
- [ ] A sweep failure does not turn the check red by itself
- [ ] A test plants an old and a fresh leftover and asserts only the old one goes
