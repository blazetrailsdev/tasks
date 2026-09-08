---
title: "DebugView's RESCUES_TEMPLATE_PATHS points at a templates/ directory the package never ships"
status: draft
updated: 2026-09-08
rfc: "0100-package-size-and-publish-shape"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::DebugView::RESCUES_TEMPLATE_PATHS`
(`actionpack/lib/action_dispatch/middleware/debug_view.rb:9-11`) is
`[File.join(File.dirname(__FILE__), "templates")]`, and that directory really
exists in the gem —
`vendor/rails/actionpack/lib/action_dispatch/middleware/templates/` holds
`rescues/` (17 templates: `diagnostics.html.erb`, `missing_template.html.erb`,
`blocked_host.html.erb`, `layout.erb`, the `_actions`/`_request_and_response`
partials, …) and `routes/` (`_route.html.erb`, `_table.html.erb`).

`packages/actionpack/src/action-dispatch/middleware/debug-view.ts:3,10` points
`RESCUES_TEMPLATE_PATHS` at `new URL("./templates", import.meta.url).href` — but
`packages/actionpack/src/action-dispatch/middleware/templates/` does not exist
anywhere in the repo, and nothing copies one into `dist`. The constant resolves
to a directory that is never there, so `DebugExceptions` cannot render any of
Rails' rescue templates.

This is the same class of gap
`journey-visualizer-reads-its-assets-off-disk` (#7619) closed for
`Journey::GTG::TransitionTable#visualizer`: a Rails call site that reads its
assets off disk, ported against assets the package never shipped.

## Converged shape

Follow #7619's precedent in this same package:

- ship the templates as real files at Rails' path,
  `packages/actionpack/src/action-dispatch/middleware/templates/{rescues,routes}/`,
  translated from the gem's `.erb` into trails' `.tse` (`erb` → `tse` per
  `docs/ruby-ts-conventions.md`), with `<%==` at expression sites the plain-ERB
  original does not escape;
- extend `packages/actionpack/package.json`'s `build` copy step (added by #7619
  for `action-dispatch/journey/visualizer`) to carry this directory into `dist`
  too, and add the matching `.prettierignore` / `eslint.config.mjs` ignores so
  any byte-for-byte asset stays byte-for-byte;
- leave `RESCUES_TEMPLATE_PATHS`' own shape alone — it already mirrors
  `debug_view.rb:9-11`; only the directory it names is missing.

Size the port by how many of the 19 templates the ported `DebugExceptions` /
`DebugView` paths actually reach; the `rescues/` layout plus the diagnostics and
missing-template pair are the load-bearing ones.

## Acceptance criteria

- `packages/actionpack/src/action-dispatch/middleware/templates/` exists, is
  copied into `dist` by the package's `build` script, and is covered by the
  published `files` field.
- `RESCUES_TEMPLATE_PATHS` resolves to a directory that exists in both a source
  checkout and a built package.
- A test renders at least one rescue template end to end through the resolved
  path, the way `transition-table.trails.test.ts` covers the visualizer's
  disk-read path.
