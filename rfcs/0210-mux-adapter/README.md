---
rfc: "0210-mux-adapter"
title: "Multiplexer adapter: fleet pane control in TypeScript, behind one interface for tmux and rmux"
status: draft
created: 2026-10-28
updated: 2026-10-28
owner: "@deanmarano"
packages: []
related-rfcs:
  - "0136-trailmap"
clusters:
  - mux-foundation
  - mux-cutover
  - mux-backends
---

# RFC 0210 — Multiplexer adapter: fleet pane control in TypeScript, behind one interface for tmux and rmux

## Summary

Every fleet pane operation runs through Go today: ringo's `tmux.Sender`
(`btwebooks/tmux/sender.go`, about 1,650 lines) shells out to `tmux` to
spawn, find, read, message and kill agent panes.

This RFC moves that code to TypeScript, in the trailmap repo, and splits it in
two:

- a small **`MuxBackend`** interface of multiplexer primitives, and
- a **`Fleet`** policy layer that does not depend on the backend.

They run in a new host-side process, **`muxd`**. Both ringo and trailmap call
it over HTTP. That makes tmux and rmux interchangeable backends and leaves
room for cmux later. Parity with the Go implementation is checked against
numeric gates before any write moves over.

## Motivation

- **Pane control is the last fleet logic welded to Go.** RFC 0136 gives the
  task domain one home, but pane control stays in Go, in 1,650 lines that
  mix tmux verbs with policy. Every primitive except one goes through two
  helpers: 55 `tmuxCmd` call sites and 10 `spawnPane` call sites. The
  exception is a raw `exec.Command("tmux", …)` in `checkSocket`. So the seam
  already exists in practice.
- **Backend choice.**
  - [rmux](https://docs.rs/crate/rmux/0.6.1) is a Rust tmux replacement with a
    tmux-style CLI, a daemon and structured snapshots. It is aimed at agents
    that run for a long time.
  - [cmux](https://www.mintlify.com/manaflow-ai/cmux/automation/cli-reference)
    is a macOS terminal for agents, controlled by a CLI and a JSON-RPC socket.

  Neither can be adopted while tmux verbs are hard-coded.

- **Behavior that has never been pinned down.** The Go package has about 18
  tests and 3 screen fixtures. Quoting, chunked submit and status
  classification are untested.

## Relationship to RFC 0136

RFC 0136 ("ringo's Go process") keeps "the tmux socket work, the spawn loop
and the `:8081` internal mux" in ringo. **This RFC supersedes only the "tmux
socket work" clause.**

- Pane primitives and pane policy move to `muxd`.
- The spawn loop, `/webhooks/github`, the SSE streams and `:8081` stay in
  ringo, as 0136 decided.
- ringo keeps its `PaneSender` interface, but its implementation changes from
  `tmux.Sender` to an HTTP client of `muxd`. No webhook or spawn-loop logic
  moves.

These ringo consumers must be on the HTTP client before `tmux/` can be
deleted. Each is listed with the interface it uses (Go file under
`btwebooks/webhook/`):

| Consumer                                                                          | Interface used                         |
| --------------------------------------------------------------------------------- | -------------------------------------- |
| `handler.go` (link, cleanup queue, reviewer spawn, delivery)                      | `PaneSender`                           |
| `spawnloop.go` (worker spawn, slug mirror of `tmux.slugify`)                      | `PaneSender`, `tmux.ShellQuote`        |
| `deploys.go`                                                                      | `deploySender`, `tmux.ShellQuote`      |
| `panescreen.go` (`/fleet/pane/<n>/screen`, relayed by trailmap)                   | `paneScreenSource`                     |
| `paneinput.go`                                                                    | `paneInputer`                          |
| `sessionarchive.go` (pane logs)                                                   | `paneArchiver`, `ArmBudgetUnlimited`   |
| `dashboard.go` (agent slots)                                                      | `PaneSender.AgentStatus`, `SetupAgent` |
| `tracker.go`, `claimsweep.go`, `worktreesweep.go`, `reviewers.go`, `broadcast.go` | `PaneSender` (exists, kill, find)      |
| `main.go:62`                                                                      | constructs `tmux.Sender`               |

The `tmux.*` helper symbols (`ConductorState`, `ShellQuote`,
`ArmBudgetUnlimited`) move into a small Go package that the HTTP client also
uses. That way no consumer imports `tmux/`.

## Design

### Topology: `muxd`, a host-side pane agent

`muxd` is a TypeScript process in the trailmap repo (`lib/mux/`,
`bin/muxd`). It runs on the **host**, not in a container, as a systemd user
unit next to the tmux server.

- It serves HTTP on loopback and on the `fleet` docker network address.
- Unlike 0136's read-mostly API, these endpoints type into agent shells, so
  being reachable on the network counts as code execution. Every request
  except `GET /up` needs a bearer token. The token is read from a `0600` file
  on the host and given to ringo and trailmap as a dokku secret. A request
  without the token gets `401`, and that is tested.
- It needs Node 24 on the host, the same floor as trailmap, installed through
  Homebrew next to the tmux binary.
- Running on the host removes three things the containers need today: the
  tmux socket bind mount, the matching tmux binary in the image, and the
  identical-path `/mnt/theta/trails` mount.
- It is also the only shape that can ever reach a backend that is not on the
  dokku host.

Its endpoints mirror the `PaneSender` surface:

- `GET /panes`, `GET /panes/:ref` (with status, input and usage-blocked)
- `GET /panes/:ref/screen`
- `POST /panes` (spawn, with variants)
- `POST /panes/:ref/message`
- `POST /panes/:ref/keys`
- `DELETE /panes/:ref`
- `GET /panes/find?repo=&branch=|pr=`
- `GET /agents/:agent`, `POST /agents/:agent`

### `MuxBackend` (`lib/mux/backend.ts`)

```ts
export interface PaneInfo {
  native: string;
  cwd?: string;
  window?: string;
  windowIndex?: number;
  active?: boolean;
}
export interface SpawnOpts {
  cwd: string;
  name?: string;
  split?: { target: string };
  detached?: boolean;
  command?: string;
}
export interface MuxBackend {
  readonly kind: "tmux" | "rmux";
  readonly reportsLiveCwd: boolean;
  available(): Promise<void>;
  listPanes(): Promise<PaneInfo[]>;
  newPane(o: SpawnOpts): Promise<string>; // native id
  sendText(native: string, text: string): Promise<void>;
  sendKeys(native: string, ...keys: string[]): Promise<void>;
  capture(native: string, history?: number): Promise<string>;
  rename(native: string, title: string): Promise<void>;
  kill(native: string, scope: "pane" | "window"): Promise<void>;
  exists(native: string): Promise<boolean>;
  pipeTo?(native: string, path: string): Promise<void>;
  stopPipe?(native: string): Promise<void>;
  moveToSlot?(native: string, slot: number): Promise<void>;
}
```

The backends:

- **`tmux.ts`:** runs the binary with `execFile`, never through a shell, and
  takes `{ bin, socket }`. It parses `-F` output in one place.
- **`rmux.ts`:** `extends TmuxBackend` with `bin` set to `rmux`. Probing
  showed no command or format differences (open question 2).

### Pane identity and discovery

Today a pane is a bare `%123`, and finding one re-derives everything from its
live cwd. That breaks for a backend without a live cwd, across a backend
switch, and if the socket changes. The design instead keeps a registry with an
explicit identity scope.

- **Instance.** A `mux_instances` row (`name`, `kind`, `socket`, `bin`,
  `active`) names one multiplexer server. Config lives in rows, not env.
- **`PaneRef` = `<instance>/<native id>`**, for example `host-tmux/%123`.
  Every stored reference uses this form: the tracker, the cleanup queue, the
  session archive and trailmap's `isPaneId`. The instance, not the backend
  kind, says which socket to query, so changing config means adding a new
  instance rather than editing the old one.
- **Registry.** A `panes` table holds `ref`, `instance`, `native`,
  `spawn_cwd`, `cwd`, `repo`, `branch`, `pr`, `title`, `spawned_at`,
  `last_seen_at` and `gone_at`. It is written on spawn, and on `/link`, which
  already binds a pane to a PR: ringo's `/link-pane` handler forwards the
  binding to `muxd` (story `ringo-http-pane-sender-shadow`).

**Reconciliation.** It runs when `muxd` starts and on every `listPanes` poll
(at most once every 5 s):

1. A live pane with no row is **adopted**. Its `cwd` comes from the backend
   if `reportsLiveCwd`, and is otherwise left unknown. This covers panes that
   existed before `muxd`, and panes started by hand.
2. For backends that report a live cwd, `cwd` is refreshed on each poll, and
   `repo` and `branch` are re-derived from git when it changes. That is
   today's behavior, now cached.
3. A row whose native id is no longer live gets `gone_at` set. It is never
   reused, even if the server recycles the native id, because a recycled id
   is adopted as a new row.

**Find** (by branch or PR) looks up the registry first: `pr` set by
spawn or `/link`, then `branch`. It falls back to a live git probe only for
adopted rows that have a cwd. A pane with no cwd and no link cannot be found,
and that is reported, not guessed.

**Backend switch.** The old instance is set `active=false`. New spawns use
the new instance. Existing refs keep resolving against their own instance
until they go away. Nothing is renamed.

### `Fleet` and screen classifiers

`lib/mux/screen.ts` ports `parseInputBox`, `stuckRetry`, `hitUsageLimit`,
`hasAPIError`, `messagePending`, the `PaneStatus` classifier, `slugify`,
`shellQuote` and `chunkByRunes` 1:1 as pure functions.

`lib/mux/fleet.ts` wraps a `MuxBackend` and the registry and provides the
`muxd` endpoints. It covers:

- worktree and claude spawn flows,
- chunked `sendMessage` with submit confirmation,
- status, input and usage-blocked checks,
- the pane-log budget, and
- agent slots.

### Pane identity in scripts

`hooks/ringo-ask.sh`, `skills-link` and the archived skills read `$TMUX_PANE`.
They switch to `muxd`'s `GET /whoami?native=$TMUX_PANE` (or the matching
variable for a future backend), which returns the `PaneRef`.

## Parity gates

The Go tests are too thin to serve as the oracle. Each gate below is a number,
and each one blocks a named step.

| Gate                   | Measure                                                                                                                                                                                                | Threshold                                                                                                                                                             | Blocks               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| G1 classifier fixtures | TS output vs Go `cmd/parity-dump` `expected.json` over `parity/screens/`                                                                                                                               | ≥ 300 screens, including ≥ 20 each of idle, busy, input-pending, usage-limit, API-error and stuck-retry; **100 % exact match**                                        | `muxd` serving reads |
| G2 command traces      | Normalized argv JSONL diff, Go `Sender` vs TS `Fleet`, through a fake `tmux` shim, over the 9 scenarios in story `mux-trace-differential`                                                              | **0 diff lines**                                                                                                                                                      | any write cutover    |
| G3 shadow soak (reads) | ringo computes status, input, usage-blocked and find through both implementations on every dashboard poll                                                                                              | **7 consecutive days**, ≥ 20,000 comparisons over ≥ 30 distinct panes, **0 unexplained mismatches** (each explained one is added to G1 first, and the clock restarts) | write cutovers       |
| G4 per-write soak      | For each write (message, spawn, kill/cleanup, pane logs) behind its flag: failure rate vs the Go baseline, which is counted per write during the G3 soak (story `mux-shadow-soak-and-mismatch-report`) | **3 days**, ≥ 50 operations, failure rate ≤ Go baseline, 0 lost messages (a sent message never confirmed and never retried)                                           | the next write; G5   |
| G5 retirement          | `rg 'tmux\.Sender' btwebooks --type go` outside `tmux/`                                                                                                                                                | **0 hits**, all G4 flags on for 7 days                                                                                                                                | deleting `tmux/`     |

## Non-goals

- **cmux.** It is macOS-only, and the fleet host is Linux. Supporting it means
  a second `muxd` on a Mac. That is a follow-up RFC ("cmux backend via a
  remote muxd"), not this one. A probe of cmux 0.65.2.2 on macOS 15.7
  (2026-10-28) gives that RFC its starting facts:
  - **Works:**
    - `new-workspace --cwd --name --focus false` and `new-split`, which
      return refs
    - `send`, which queues input until the PTY is ready
    - `send-key` (`enter`, `ctrl+c`, `escape`)
    - `read-screen` with `--scrollback --lines`; a 3,013-byte literal with
      `é→✓` arrived intact
    - `rename-workspace`, `list-panes`, `workspace list`, `close-workspace`
  - **No live cwd.** After a `cd`, the surface still showed its spawn
    directory. cmux sets `reportsLiveCwd = false`, so find depends on the
    registry's spawn cwd and `/link` (see **Pane identity and discovery**).
  - **No `pipe-pane` equivalent,** so a cmux instance runs with session
    archiving off (open question 3).
  - **Socket access is closed by default.** The `cmuxOnly` mode refuses any
    process not started inside cmux, which includes `muxd`. `password` mode
    works, but in 0.65.2.2 the password must be set in Settings; a
    `socketPassword` in `cmux.json` is ignored. So the setup can't be done
    from config alone.
  - **`exists` must use `workspace list`.** `identify --workspace <closed
ref>` exits 0 and reports the focused workspace instead of failing.
  - **Native ids should be UUIDs** (`--id-format uuids`), not the short
    `workspace:N` refs, so registry keys never depend on how refs are
    numbered.
- **Moving the spawn loop, webhook ingest, SSE or `:8081` out of ringo.** RFC
  0136's boundary stands except for pane control.
- **Running `muxd` inside trailmap's container.** That keeps every mount
  problem this RFC removes, and it cannot reach a non-local backend.
- **Multi-host fleets.** Instances make this possible, but routing panes
  across hosts is not designed here.

## Alternatives considered

- **Port inside ringo (a Go `Backend` interface).** This is the smallest
  change, and it was the first draft. It was rejected because fleet logic is
  converging on TypeScript in trailmap, and a Go abstraction would be ported a
  second time.
- **`MuxBackend` inside the trailmap web process.** This needs the socket,
  binary and theta mounts in the container, and it ties pane control to
  trailmap deploys, which restart the web process. `muxd` restarts on its own
  schedule.
- **Have trailmap call ringo's existing pane endpoints.** This keeps the code
  in Go forever, so the backend choice never happens.
- **Treat rmux as a drop-in `tmux` binary through its shim.** This is free if
  it works, but it can't be checked without the contract suite. It stays as
  the first thing `mux-rmux-backend` tries.

## Rollout

1. **Foundation** (`mux-foundation`):
   - `mux-parity-screen-corpus-and-go-dump`
   - `mux-backend-interface-and-tmux-backend`
   - `mux-port-screen-classifiers`
   - `mux-pane-registry-and-reconciliation`
   - `mux-port-fleet-policy`
   - `mux-trace-differential`
2. **Agent** (`mux-foundation`):
   - `muxd-host-pane-agent`
   - `mux-shared-go-helpers-package`
   - `ringo-http-pane-sender-shadow`

   Gate: G1.

3. **Soak** (`mux-cutover`): `mux-shadow-soak-and-mismatch-report`. Gate: G3.
4. **Write cutovers**, one at a time, each gated by G2 and by the previous
   one's G4 (`mux-cutover`):
   - `mux-cutover-send-message`
   - `mux-cutover-spawn`
   - `mux-cutover-kill-and-cleanup`
   - `mux-cutover-pane-logs`
   - `mux-pane-ref-migration-and-whoami`
5. **Retirement** (`mux-cutover`): `retire-ringo-tmux-package`. Gate: G5.
6. **Backends** (`mux-backends`): `mux-backend-contract-suite`, then
   `mux-rmux-backend`. These can start after phase 1.

## Verification

- G1 to G5 pass at the numbers above.
- After retirement:
  - `btwebooks/tmux/` is deleted and `main.go` builds no `tmux.Sender`.
  - `rg TMUX_PANE` across btwebooks hooks and skills returns 0.
- The contract suite passes on the tmux and rmux backends.
- The fleet runs on rmux end to end for 3 days with G4-level failure rates.

## Open questions

None left. Each one is resolved below.

1. **Where does pane control run? Resolved: a host-side helper.** `muxd`
   runs on the host as a systemd user unit, not in a container (owner
   decision, 2026-10-28). See **Topology**.
2. **Can `TmuxBackend` be reused for rmux? Resolved: yes, as a subclass that
   changes only the binary.** This was tested against rmux 0.7.1 (Homebrew)
   on 2026-10-28, on an isolated `-L` socket. Every tmux command `sender.go`
   issues behaves as it does in tmux:
   - `list-panes` / `list-windows -a -F` with `pane_id`,
     `pane_current_path`, `window_name`, `pane_active`, `window_index` and
     `window_id`
   - `new-window` / `split-window -P -F '#{pane_id}'`, which return `%N` ids
   - `send-keys -l` (a 3,013-byte literal including `é→✓` arrived intact),
     and named keys `Enter`, `C-c` and `Escape`
   - `capture-pane -p`, `-e` and `-S -N`
   - `display-message -p` with formats
   - `pipe-pane -o`, which toggles on and off (`#{pane_pipe}` 1 then 0) and
     writes the raw stream
   - `rename-window`, `select-pane -T`, `select-window`, and `move-window`
     (the index moved to 7)
   - `set-option`, `kill-pane`, `kill-window`, `kill-server`
   - a missing pane fails with `can't find pane` and a non-zero exit
   - `#{pane_current_path}` follows a `cd`, so rmux sets
     `reportsLiveCwd = true`

   One thing to know: a socket path passed to `-S` must fit the Unix
   socket-path limit (about 108 bytes). rmux fails with `File name too long`
   instead of falling back, so instance config should prefer `-L <name>` or
   a short `-S` path.

   `mux-rmux-backend` still runs the contract suite and the 3-day fleet
   soak. The snapshot SDK stays unused unless the contract suite fails.

3. **Must every backend provide pane logs? Resolved: no.** `pipeTo` is
   optional. An instance without it turns session archiving off and shows a
   "no archive" badge on its panes. Polling `capture` was rejected: it drops
   output between polls, so the archive would have gaps nobody can see. Both
   tmux and rmux provide `pipeTo`.
4. **Where does the registry live? Resolved: `muxd`'s own SQLite file** at
   `/mnt/theta/trails/muxd/muxd.db`. Pane control must keep working when
   trailmap is down, and putting it in trailmap's DB would make every pane
   lookup depend on the web app. trailmap reads pane state through `muxd`'s
   API.

## Changelog

- 2026-10-28: initial RFC
- 2026-10-28: review round 1 changes:
  - added `muxd` host topology and the 0136 supersession with its consumer
    list,
  - added the pane registry and reconciliation rules,
  - turned the parity checks into numeric gates G1 to G5,
  - moved cmux to non-goals,
  - added the remaining template sections and the stories.
- 2026-10-28: tightened the design:
  - `muxd` requires a bearer token, because it can type into agent shells,
  - the Go write-failure baseline is now measured during the G3 soak,
  - the `/link` binding to the registry is now owned by a story,
  - corrected the count of primitive call sites.
- 2026-10-28: resolved the open questions:
  - pane control runs as a host-side helper (owner decision),
  - rmux reuses `TmuxBackend` unchanged, per a probe of every `sender.go`
    tmux command against rmux 0.7.1,
  - pane logs are optional per backend,
  - the registry lives in `muxd`'s own SQLite file.
- 2026-10-28: recorded the cmux 0.65.2.2 probe results in the cmux non-goal
  for the follow-up RFC.
