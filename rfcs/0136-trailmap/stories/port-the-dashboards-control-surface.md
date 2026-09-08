---
title: "Port the fleet dashboard's control surface: usage, spawn loop, broadcast, asks and row buttons"
status: draft
updated: 2026-09-08
rfc: "0136-trailmap"
cluster: null
packages: ["actionview", "actionpack"]
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

`render-the-fleet-dashboard-root-page` (PR #19) ported ringo's `/` as a **read**
view: every section the SSE envelope carries renders, and one control (manual
spawn) came along because the repo `<option>` list was an acceptance criterion.
Everything else on ringo's dashboard that WRITES was deliberately left behind,
enumerated in that PR rather than dropped silently. This story is the other
half.

What is not ported, with its ringo source:

### Panels

- Usage bars, Claude and Codex — `renderUsage` (`webhook/dashboard.go:1426`),
  `renderCodexUsage` (`:1556`), and the bar/marker helpers `barColor`,
  `weeklyPaceColor`, `parseResetDate`, `weekElapsedPercent`, `renderDayMarkers`
  (`:1288-1425`). Markup at `dashboard.go:371-430`.
- Spawn-loop settings — `renderSpawnLoop` (`:2181`), `toggleSpawnLoop`,
  `setSpawnLoopCap`, `skipNext`, `spawnLoopNow`. Live cap, queue cap, interval,
  bundle mode, next-story and skip. Markup at `dashboard.go:437-470`.
- Broadcast box — `sendBroadcast` / `refreshBroadcastCounts`
  (`:1994-2030`), with its `all` and `CI red` audiences and live counts from
  `GET /broadcast/targets`.
- Relayed questions ("Agents waiting on you") — `renderAsks` (`:622`),
  `answerAsk`, `answerAskFree`. Note this panel renders **model-authored** text
  and is the reason ringo has `escHtml`/`escAttr` at all (`:614-620`).
- Queue / drain / poke — `renderQueue` (`:1767`), `drainQueue`, `sendOne`,
  `drainCodexReviewers` / `drainClaudeReviewers` (`:964`), `pokeStalled` and
  `updatePokeButton` (`:2119-2146`).

### Per-row buttons

- merge (`renderInto`, `dashboard.go:1266`), spawn dismiss and clear-failed
  (`:1200-1215`), CI-fixer respawn (`:783-790`), and the reviewer/worker `+`
  buttons (`reviewerLine` `:812`, `workerLine` `:841`).

## Shape expected

These are POSTs into Go-owned process state (tmux sockets, the spawn loop), and
RFC 0136's non-goals keep that state on Go. So this story is **not** "move the
spawn loop into trailmap" — it is "trailmap's dashboard can drive ringo's
existing endpoints", the same shape PR #19 used for manual spawn:

- `config/fleet.ts`'s `fleetEventsUrl()` already establishes ringo's origin, and
  `ringoUrl(path)` in `app/assets/javascripts/dashboard.js:33-41` already
  resolves a control path against it. Both generalise; neither needs redesign.
- Same-origin routing at the SSO proxy is what makes the POSTs carry the session
  cookie. See `docs/fleet-dashboard.md` — and note the credentialed-CORS trap
  written up there, which bites controls exactly as it bites the stream.
- The ask panel's escaping is not optional: that text is model-written.
  `fleet-format.js` already exports a correct `esc`; use it, do not re-derive.

Worth splitting when claimed — the usage bars alone are ~250 LOC of ringo JS,
and the per-row buttons are a much smaller, more valuable slice. Land the
buttons first: they are what a person reaches for while watching the page.

## Acceptance criteria

- The dashboard's write controls work against ringo's existing endpoints, with
  no Go state moved into trailmap and `webhook/dashboard.go` untouched.
- Per-row merge, dismiss, clear-failed and respawn behave as ringo's do,
  including their disabled/in-flight states.
- Model-authored text in the relayed-question panel is escaped.
- Anything pure is added to `fleet-format.js` and unit-tested there, not
  inlined into the DOM wiring.
