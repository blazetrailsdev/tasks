---
title: "RFC page: a long-running discussion session tab, parked when idle and resumed on demand"
status: draft
updated: 2026-11-19
rfc: "0136-trailmap"
cluster: null
packages: []
deps:
  - bump-the-ringo-pin-for-rfc-session-endpoints
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The RFC show page (`rfc_pages#show`, trailmap `config/routes.ts:114`) renders
its tabs from `rfcTabs` in `app/views/rfc-pages/show.html.tse:21-25`;
Refinements is the only extra tab (`rfc/:id/refinements`,
`rfc-pages-controller.ts:200`), and it shows refine reports only after the
agent POSTs them (`rfc-refines-controller.ts`). Talking to an agent happens on
the pane page (`/panes/:id`) through `fleet/pane/:id/send`
(`config/routes.ts:77-80`). The operator wants to discuss an RFC's stories and
edits with an agent from the RFC page itself, and watch refines and sunsets of
that RFC live.

## Acceptance criteria

- A new **Session** tab on the RFC page (`rfc/:id/session`) with a
  transcript/screen view and a message box.
- An `RfcSession` model on trailmap's `Base` (`rfc_id`, `session_id` UUID,
  `pane`, `state`, `last_dialog_at`, timestamps), one per RFC. The UUID is
  generated and saved when the session is first created, before calling
  ringo's `/rfc-session/start`.
- Sending a message calls ringo's `/rfc-session/send` with the stored
  `session_id`; when the pane was reaped, ringo resumes it with
  `--resume`, and the tab shows a "resuming" state until the prompt is back.
- After 5 minutes with no dialog ringo closes the tmux pane; the tab keeps
  showing the session as active (state `parked`, transcript still readable
  from ringo's `/rfc-session/transcript`) and the next message reopens it transparently.
- The tab (and the Refinements tab) shows in-flight refine and sunset runs
  for this RFC from ringo's `/api/rfc-spawns?slug=`, each with its live pane
  screen via the existing `fleet/pane/:id/screen` relay, updated from
  `/events` rather than polling; a finished run links its report.
- Controller and model tests run against a ringo stub that serves the new
  endpoints, as the dashboard stub does (trailmap#176). The tab can be built
  and tested against the stub before the ringo stories land; the story
  closes only after one manual run against the deployed endpoints (start,
  park after 5 idle minutes, resume with earlier turns intact), recorded in
  the PR.
