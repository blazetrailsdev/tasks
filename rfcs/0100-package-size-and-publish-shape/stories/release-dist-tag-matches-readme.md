---
title: "release.yml's alpha dist-tag and README's practice tag disagree; latest points at a practice build"
status: done
updated: 2026-11-28
rfc: "0100-package-size-and-publish-shape"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: trails#10865
claim: "2026-11-28T14:09:26Z"
assignee: "release-dist-tag-matches-readme"
blocked-by: null
closed-reason: null
---

## Context

Found while wiring the post-publish registry check (trails#10856).
README.md "Versioning and releases" says practice releases (`0.1.0-alpha0.N`) go out
under the npm dist-tag `practice`, so `latest` never points at one. But
`.github/workflows/release.yml`'s Publish step maps every `*-alpha*` tag to `--tag alpha`,
and the registry today reads `{ latest: '0.1.0-alpha0.1', alpha: '0.1.0-alpha0.2' }`:
`latest` does point at a practice build, and no `practice` tag exists. The README's
getting-started block and the trailmap canary both resolve `@alpha`, so whichever rule
wins, the two must agree.

## Acceptance criteria

- release.yml and README.md name the same dist-tag for `0.1.0-alpha0.N` practice builds.
- `latest` does not point at a practice build after the next publish (re-point it with
  `npm dist-tag` if the decision keeps practice builds off `latest`).
- README's npm block, `scripts/release/registry-check.sh` and trailmap's `canary.yml`
  resolve the tag that decision names.
