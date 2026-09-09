---
title: "trails-packages-missing-files-field"
status: draft
updated: 2026-09-09
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Five trails packages ship tarballs with no code in them, and it blocks
continuous trails tracking outright. Found by the first real run of
`scripts/track-trails.sh` (tasks repo) against trails main `9a6453209`.

`date`, `did-you-mean`, `globalid`, `i18n` and `ruby-compat` have **no `files`
field** in their `package.json`. Every other vendored package declares
`files: ["dist"]` (`activerecord` declares `["dist", "bin"]`). With no `files`,
npm's default packing applies, which excludes gitignored paths — and trails'
root `.gitignore` line 2 is `dist/`.

The failure mode is nastier than an empty tarball, because npm force-includes
whatever `main` points at. So `blazetrails-date-0.1.0.tgz` contains **exactly
one** `dist` file:

```text
$ tar tzf vendor/blazetrails-date-0.1.0.tgz | grep dist
package/dist/index.js
```

The package installs cleanly, resolves, and then dies at the first relative
import out of the entrypoint:

```text
Error [ERR_MODULE_NOT_FOUND]: Cannot find module
  .../@blazetrails/date/dist/acts-like.js
  imported from .../@blazetrails/date/dist/index.js
```

`ruby-compat` fails the same way on `dist/name-error.js` — and `ruby-compat` is
a _new_ transitive dependency since the current pin, so nothing had exercised
its packing before.

`@blazetrails/date` is a **direct** dependency of the tasks CLI, so this is not
a corner: it is the whole vendoring path for trailmap and for tasks.

## This is the only thing standing between tasks and trails main

Verified, not assumed. Adding `files: ["dist"]` to those five package.json
files in a scratch clone and re-running the tracker takes the full smoke green
against trails main — connect, migrate, model writes, ready queue, and
`bin/tasks ready --json` through the packaged `dist`:

```text
==> candidate passed
```

That is 538 commits of trails adopted in one step, gated by nothing but this
one-line-per-package fix.

## Acceptance criteria

- `packages/{date,did-you-mean,globalid,i18n,ruby-compat}/package.json` each
  declare `files: ["dist"]`, matching their siblings.
- `pnpm pack` on each produces a tarball containing the whole `dist`, not just
  the `main` entrypoint. A test or a lint over the workspace that asserts every
  publishable package declares `files` would stop the next one — the gap
  reappeared silently when `ruby-compat` was added.
- With the fix on trails main, `pnpm trails:track` in the tasks repo completes
  and moves `vendor/TRAILS_PIN`.
