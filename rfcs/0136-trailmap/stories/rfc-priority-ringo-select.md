---
title: "RFC page priority is ringo's select (- and 1-9), not a number field"
status: draft
updated: 2026-11-17
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

trailmap#154 shipped the RFC show page's priority control as a number field with Set and Clear buttons. The user asked for ringo's control instead: a `<select>` with `-` (unset) and 1–9 that submits on change. #154 merged before that rework was pushed. The rework is done and green on branch `rfc-priority-ringo-select` (commit b5916e9), which is ahead of main by that one commit.

It changes `app/views/rfc-pages/show.html.tse` and `rails/app/views/rfc_pages/show.html.erb` (`formWith`/`form_with` + `f.select` + `optionsForSelect`), `app/assets/javascripts/rfc-actions.js` (a `select[data-autosubmit]` calls `form.requestSubmit()` on change; the file is symlinked into `rails/app/javascript`), the CSS, and the tests on both sides. A current priority outside 1–9 is added as a selected option so the select never misreports it (`0061-ci-failures` is 0). `POST /rfc/:id/priority` and `Rfc#prioritySet` / `priority_set` are unchanged.

## Acceptance criteria

- `/rfc/<id>` shows a select of `-`, 1–9 (plus the current value if it is outside that range), and choosing an option sets the priority without a button press; `-` clears it.
- A `<noscript>` Set button keeps the select usable without JavaScript.
- The trails and Rails tests for the page (`test/controllers/rfc-priority.test.ts`, `rails/test/controllers/rfc_priority_test.rb`) assert the select and the selected option.
- The PR body carries screenshots of a set and an unset RFC.
