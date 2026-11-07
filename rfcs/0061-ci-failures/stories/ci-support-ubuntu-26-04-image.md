---
title: "CI: pass on ubuntu-26.04 runners and drop the 24.04 pin"
status: draft
updated: 2026-11-07
rfc: "0061-ci-failures"
cluster: null
packages: []
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

trails#9847 pinned every hosted `runs-on` in `.github/workflows/ci.yml` to `ubuntu-24.04`, because the `ubuntu-26.04` image (ImageMagick 7.1.2-18, newer ffprobe) failed:

- `packages/activestorage/src/analyzer/audio-analyzer.test.ts` "analyzing an audio": duration 0.863379 vs expected 0.914286 (Rails `activestorage/test/analyzer/audio_analyzer_test.rb`).
- `packages/mini-magick/test/shell.test.ts` "executes the command in the shell": stderr says "no decode delegate" rather than "unable to open image".
- image-processing: `magick portrait.jpg -auto-orient +strip` exits 1; a resize answers `[75, 100]` rather than `[150, 200]`.

## Acceptance criteria

- Find out why each tool's output differs on 26.04, whether that is a policy.xml or delegate gap, a missing package, or a real change in behavior, and fix the CI install steps or the port so the tests pass unchanged.
- Remove the `ubuntu-24.04` pin. Do not edit or skip any test.
