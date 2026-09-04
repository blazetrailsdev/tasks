---
title: "pnpm12-lockfile-package-manager-document-churn"
status: draft
updated: 2026-09-04
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

pnpm 12 (#7489, `packageManager: pnpm@12.3.4`) turns `pnpm-lock.yaml` into a
**two-document** YAML file: pnpm prepends a document recording the package
manager pin itself under `packageManagerDependencies`, separated from the real
lockfile by a `---` marker at `pnpm-lock.yaml:101`.

That prepended document is **environment-dependent, and `--frozen-lockfile`
rewrites it in place** — it is not read-only. Measured on #7489:

- Cold store (a fresh ephemeral runner container): pnpm records `pnpm` alone —
  101 lines. This is the form committed in #7489.
- Warm store where the bootstrap pulled the native binary: pnpm additionally
  records `@pnpm/exe` plus its eight per-platform entries — 120 lines.

So `pnpm install --frozen-lockfile` on a developer machine silently adds 19
lines, and a cold CI container silently removes them again. Confirmed by running
frozen installs under both a cold `HOME` and the real one and diffing.

This does not red CI today — `.github/workflows/ci.yml` runs
`pnpm install --frozen-lockfile --prefer-offline` at ~28 sites and none of them
follow it with a dirty-tree check (`git diff --exit-code` / `git status
--porcelain` appear nowhere in `.github/workflows/` or `.github/actions/`). It
is a permanent source of spurious lockfile diffs and cross-branch conflicts.

The knob is pnpm's `managePackageManagerVersions` setting. Turning it off stops
the self-install, which stops the recording — but it is **not** a free win, and
that is why this is its own story rather than part of #7489:
`.github/actions/setup-pnpm/action.yml:76-79` asserts the self-hosted runner's
`pnpm --version` exactly equals the `pnpm-version` input, and #7489 merges
without an image rebuild _precisely because_ `managePackageManagerVersions`
makes a pnpm 11.5.1 image self-install the pin and report `12.3.4`. Disabling it
re-arms that lockstep hazard: the Dokku image would have to be rebuilt with
`PNPM_VERSION=12.3.4` and `dokku ps:scale gh-runner` cycled _before_ the setting
lands, with no green intermediate state.

## Acceptance criteria

- Decide between the two coherent end states and implement one:
  - **Keep `managePackageManagerVersions` on** and make the recorded document
    deterministic (or accept the churn explicitly, documented where a
    contributor hits it).
  - **Set `managePackageManagerVersions: false`** in `pnpm-workspace.yaml`,
    coordinated with the runner-image rebuild described above, so the assertion
    at `action.yml:76-79` keeps passing.
- Whichever is chosen, `pnpm install --frozen-lockfile` must leave
  `pnpm-lock.yaml` byte-identical on both a cold store and a warm one.
- If the lockstep path is taken, the image rebuild and the merge are sequenced
  in the PR body, since the assertion is exact-match in both directions.
