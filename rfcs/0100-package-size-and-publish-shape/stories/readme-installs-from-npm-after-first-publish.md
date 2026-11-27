---
title: "README installs @blazetrails/* from npm once the first alpha is published"
status: ready
updated: 2026-11-27
rfc: "0100-package-size-and-publish-shape"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 15
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`README.md:19` says "It is pre-release. Nothing is published to npm yet, so you run it from a" checkout. Once `0.1.0-alpha0.1` is on npm (the one-time manual publish that `docs/releasing.md` § "Adding a package" describes, ahead of trusted publishing from trails#10831), that sentence is false and the install instructions around it point new users at a checkout instead of the registry.

## Acceptance criteria

- `README.md`'s getting-started section installs from npm (`pnpm add @blazetrails/trails@alpha` or the generator entry point), naming the `alpha` dist-tag.
- The "Nothing is published to npm yet" sentence is removed; running from a checkout stays documented as the contributor path.
- Land only after `npm view @blazetrails/trails version` answers a version.
