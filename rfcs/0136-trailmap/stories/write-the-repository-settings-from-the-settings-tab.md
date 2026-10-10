---
title: "trailmap: write the repository settings from the settings tab"
status: draft
updated: 2026-10-10
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`/:owner/:repo/settings` (trailmap#48) renders a repository's feature switches
and the application settings, read-only. The page says so:

> A tab turned off is not drawn above and answers 404. Read-only here — the
> form that writes these is its own story.

This is that story.

The switches are already load-bearing, which is why the form is worth having:
`RepositorySetting` decides what the tab bar draws and what
`repos/repo-controller.ts`'s `beforeAction` refuses, so turning `wiki` off
removes the tab and 404s `/blazetrailsdev/trails/wiki`. Today that can only be
done with a SQL update.

Everything the page needs to WRITE is missing and is the work: trailmap has no
form, no POST route outside the loopback JSON API, and no action that takes
parameters from a browser. `app/views/dashboard` posts controls, but through
`fleet#control`, which forwards to ringo and parses nothing.

## Converged shape

- `PATCH /:owner/:repo/settings` → `repo_settings#update`, drawn inside the
  existing `scope(":owner/:repo")` so it inherits the owner/repo constraints.
- A form in `app/views/repo-settings/show.html.tse` with `csrf_meta_tags`'
  token — the layout already emits it (trailmap#43) and
  `scripts/smoke-boot.sh` already proves a control POST without it is refused.
- Strong parameters: permit exactly the six `*_enabled` booleans
  (`OPTIONAL_TABS` names them), never the whole hash — `repository_id` must not
  be assignable from a form.
- Redirect back to the tab on success, as Rails does, so a reload does not
  re-submit.
- The application settings (`Setting`, one key today) are a separate form or a
  separate story: they are global, and mixing them into a per-repository PATCH
  would let one repository's page write another's behaviour.

## Acceptance criteria

- [ ] Turning a switch off from the page removes the tab from the bar and makes
      that tab 404, with no restart.
- [ ] The six switches are the only assignable attributes; a crafted field
      naming `repository_id` or `id` is refused, with a test that sends one.
- [ ] A POST without the CSRF token is refused, as the fleet controls already
      are.
- [ ] A repository with no `repository_settings` row gets one written on first
      save rather than erroring (`ALL_TABS_ENABLED` is the read-side default).
- [ ] `test/controllers/repo-tabs.test.ts`'s disabled-tab case keeps passing —
      the write path must agree with the read path it already pins.
