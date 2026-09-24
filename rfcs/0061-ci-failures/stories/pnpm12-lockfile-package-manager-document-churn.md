---
title: "Stop pnpm 12 rewriting the packageManagerDependencies lockfile document"
status: done
updated: 2026-09-24
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: trails#8047
claim: "2026-09-24T16:59:06Z"
assignee: "pnpm12-lockfile-package-manager-document-churn"
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
  101 lines.
- Warm store where the bootstrap pulled the native binary: pnpm additionally
  records `@pnpm/exe` plus its eight per-platform entries — 120 lines.

The **warm** form is what is committed today (`pnpm-lock.yaml:15-99` carry the
`@pnpm/exe.*@12.3.4` entries; the document marker sits at `:101`), so the churn
now runs the other direction from #7489: a frozen install in a cold container
silently removes those 19 lines, and the next developer install adds them back.
Confirmed by running frozen installs under both a cold `HOME` and the real one
and diffing.

This does not red CI today — `.github/workflows/ci.yml` runs
`pnpm install --frozen-lockfile --prefer-offline` at ~28 sites and none of them
follow it with a dirty-tree check (`git diff --exit-code` / `git status
--porcelain` appear nowhere in `.github/workflows/` or `.github/actions/`). It
is a permanent source of spurious lockfile diffs and cross-branch conflicts.

The knob is pnpm's `managePackageManagerVersions` setting: turning it off stops
the self-install, which stops the recording.

### The lockstep hazard that made this a two-sided decision is gone

This story was originally filed as a choice between two end states because
`.github/actions/setup-pnpm/action.yml:64-83` asserts the runner's preinstalled
`pnpm --version` **exactly** equals the `pnpm-version` input, and #7489 merged
without a runner-image rebuild _precisely because_
`managePackageManagerVersions` makes a pnpm 11.5.1 image self-install the pin
and report `12.3.4`. Disabling the setting would have re-armed that lockstep:
the Dokku `gh-runner` image had to be rebuilt and cycled first, with no green
intermediate state.

**That path is retired.** The sibling story
`rebuild-self-hosted-runner-image-for-pnpm-12` is closed
(`closed-reason: we don't use the local runner`), and the assertion is guarded by
`if: runner.environment != 'github-hosted'` (`action.yml:63`), so it does not
run at all on a GitHub-hosted runner. `vars.RUNNER` is unset on the repository
(`gh api repos/blazetrailsdev/trails/actions/variables` returns no variables),
so every `runs-on: ${{ vars.RUNNER || 'ubuntu-latest' }}` job resolves to
`ubuntu-latest` — verified on green main run 35733541427, where `Lint` and
`Build & Type Check` both report `labels: ubuntu-latest` and a
`GitHub Actions …` runner name. The self-hosted branch of `setup-pnpm` is dead
code on today's configuration.

So there is no image to rebuild and no sequencing to coordinate: the setting can
be flipped on its own.

## Acceptance criteria

- `managePackageManagerVersions: false` in `pnpm-workspace.yaml`, and the
  `packageManagerDependencies` document dropped from `pnpm-lock.yaml`.
- `pnpm install --frozen-lockfile` leaves `pnpm-lock.yaml` byte-identical on
  both a cold store and a warm one.
- State in the PR body that the self-hosted assertion at
  `.github/actions/setup-pnpm/action.yml:64-83` is inert on the current
  configuration (`vars.RUNNER` unset ⇒ `ubuntu-latest` ⇒ `runner.environment ==
'github-hosted'`), so no runner-image rebuild is sequenced with this change.
- A comment on the self-hosted guard (`action.yml:63`) saying that
  `managePackageManagerVersions` is off, so a runner image no longer
  self-installs the pin: if `vars.RUNNER` is ever set back to `self-hosted`,
  `infra/runner/Dockerfile` must ship pnpm 12.3.4 in the image itself.

## Definition of done

Accepting the churn (documenting it, or adding `pnpm-lock.yaml` to a
`.gitattributes` merge strategy) does not close this story; the lockfile has to
stop changing under `--frozen-lockfile`.

## Verification

From a clean trails checkout on the merge commit:

```sh
pnpm install --frozen-lockfile --prefer-offline && git diff --exit-code pnpm-lock.yaml
HOME=$(mktemp -d) pnpm install --frozen-lockfile && git diff --exit-code pnpm-lock.yaml
head -1 pnpm-lock.yaml   # `lockfileVersion: '9.0'`, not a `---` document marker
```

Both diffs exit 0 and `grep -c packageManagerDependencies pnpm-lock.yaml`
prints `0`.

## Notes

- Hosted CI is unaffected by the flip: `setup-pnpm` installs pnpm on
  GitHub-hosted runners through `pnpm/action-setup` with
  `version: ${{ inputs.pnpm-version }}` (`action.yml:38-41`), not through pnpm's
  self-install.
- Contributors lose the auto-install of the `packageManager` pin: a machine
  running a different pnpm no longer upgrades itself on `pnpm install`. Corepack
  (`corepack enable`) honours the same `packageManager` field, so point the
  contributing docs at it if they do not already.
