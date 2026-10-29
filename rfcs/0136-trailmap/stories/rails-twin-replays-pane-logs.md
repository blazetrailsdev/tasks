---
title: "rails/: /sessions/pane replays a pane log instead of answering 501"
status: in-progress
updated: 2026-10-29
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trailmap#93
claim: "2026-10-29T13:52:37Z"
assignee: "port-the-session-transcript-page"
blocked-by: null
closed-reason: null
---

## Context

trailmap#88 ported `/sessions/pane` to the Rails twin. It checks the path and sends a `.jsonl` file to the transcript page, but for a pane log it answers 501. The trails app replays the log through ringo's own terminal emulator, compiled to WASI and run by `lib/ringo-core.ts:253` (`renderPaneLog`, through `runRingoCore` at :89). Ruby cannot load that module without a new gem. `rails/DEVIATIONS.md` ("the pane replay runs ringo's renderer") records the gap, and `rails/app/controllers/sessions_controller.rb#pane` is the 501.

## Acceptance criteria

- [ ] `/sessions/pane?p=<pane log>` on the Rails app answers 200 with the replayed scrollback, the same page the trails app renders (`app/views/sessions/pane.html.tse`): tail bounded to 2 MiB, 20,000 lines, and the "showing the last" notice.
- [ ] Either a WASI runtime gem runs `vendor/ringo`'s core build, or the emulator is ported to Ruby. Record the choice in DEVIATIONS.md, and remove the entry once the output matches.
- [ ] `script/tandem` agrees on a pane log page.
