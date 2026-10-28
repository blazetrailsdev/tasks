---
rfc: "0000-mux-adapter"
title: "Multiplexer adapter: tmux, rmux and cmux behind one TypeScript interface in trailmap"
status: draft
created: 2026-10-28
updated: 2026-10-28
owner: "@deanmarano"
packages: []
related-rfcs:
  - "0136-trailmap"
clusters: []
---

<!-- Unnumbered until merge. -->

# RFC — Multiplexer adapter: tmux, rmux and cmux behind one TypeScript interface in trailmap

## Summary

Every fleet pane operation runs through Go today: ringo's `tmux.Sender`
(`btwebooks/tmux/sender.go`, about 1,650 lines) shells out to `tmux` for
spawning, finding, reading, messaging and killing agent panes. Trailmap only
relays what ringo reports (`app/controllers/panes-controller.ts`,
`lib/fleet-relay.ts`).

This RFC moves that logic into trailmap as TypeScript and splits it in two:

- a small **`MuxBackend`** interface of multiplexer primitives, and
- a **`Fleet`** policy layer that does not depend on the backend.

With that split, tmux, rmux and cmux are interchangeable backends. Parity with
the Go implementation is checked mechanically before trailmap takes over any
write.

## Motivation

- **One home for fleet logic.** RFC 0136 moves the task domain into trailmap,
  but pane control stays in Go. That keeps two languages and two processes on
  the spawn path.
- **Backend choice.**
  - [rmux](https://docs.rs/crate/rmux/0.6.1) is a Rust tmux replacement with a
    tmux-style CLI, a daemon and structured snapshots. It is aimed at agents
    that run for a long time.
  - [cmux](https://www.mintlify.com/manaflow-ai/cmux/automation/cli-reference)
    is a macOS terminal for agents, controlled by a CLI and a JSON-RPC Unix
    socket (`new-workspace`, `send`, `send-key`, `read-screen`).

  Neither can be adopted while tmux verbs are spread across one Go file.

- **Testability.** The Go package has about 18 tests and 3 screen fixtures.
  Most of its behavior, such as quoting, chunked submit and status
  classification, has never been pinned down.

## What exists today

`sender.go` mixes two layers.

**Primitives.** All calls go through `tmuxCmd` (`sender.go:76`) and
`spawnPane` (`:1601`):

- `send-keys` (15 call sites) and `capture-pane` (8)
- `list-panes` and `list-windows`, using `-F` formats such as
  `#{pane_id}|#{pane_current_path}`
- `new-window` and `split-window`
- `display-message`, `select-pane` and `select-window`
- `rename-window` and `move-window`
- `pipe-pane`, used for pane logs
- `kill-pane` and `kill-window`

**Policy that does not depend on the backend:**

- Finding a pane by branch or PR from the pane's cwd and git
  (`FindPaneByBranch`, `FindPaneByPRNumber`).
- The worktree and claude spawn flows.
- Screen classifiers: `parseInputBox`, `stuckRetry`, `hitUsageLimit`,
  `hasAPIError` and `messagePending`.
- Chunked message submit and the check that it was submitted (`SendMessage`,
  `confirmSubmitted`).
- The pane-log budget, agent slots (`AgentStatus`, `SetupAgent`), `slugify`
  and `shellQuote`.

Ringo's consumers already depend on interfaces: `PaneSender`
(`webhook/handler.go:32`), `deploySender`, `paneInputer`, `paneScreenSource`
and `paneArchiver`. Together they are the specification for what the TS port
must provide.

## Design

### `lib/mux/backend.ts`

```ts
export type PaneRef = string; // "tmux:%123" | "rmux:%4" | "cmux:<surface-uuid>"
export interface PaneInfo {
  id: PaneRef;
  cwd?: string;
  window?: string;
  windowIndex?: number;
  active?: boolean;
}
export interface SpawnOpts {
  cwd: string;
  name?: string;
  split?: { target: PaneRef };
  detached?: boolean;
  command?: string;
}
export interface MuxBackend {
  readonly kind: "tmux" | "rmux" | "cmux";
  available(): Promise<void>;
  listPanes(): Promise<PaneInfo[]>;
  newPane(o: SpawnOpts): Promise<PaneRef>;
  sendText(p: PaneRef, text: string): Promise<void>;
  sendKeys(p: PaneRef, ...keys: string[]): Promise<void>;
  capture(p: PaneRef, history?: number): Promise<string>;
  rename(p: PaneRef, title: string): Promise<void>;
  kill(p: PaneRef, scope: "pane" | "window"): Promise<void>;
  exists(p: PaneRef): Promise<boolean>;
  pipeTo?(p: PaneRef, path: string): Promise<void>;
  stopPipe?(p: PaneRef): Promise<void>;
  moveToSlot?(p: PaneRef, slot: number): Promise<void>;
}
```

Every pane reference carries its backend as a prefix, so stored state (the
tracker, the cleanup queue, the session archive) cannot mix backends.
`isPaneId` in `config/fleet.ts` is widened to accept these prefixed
references.

### Backends

- **`tmux.ts`:** runs the binary with `execFile`, never through a shell, and
  takes `{ bin, socket }`. It parses `-F` output into `PaneInfo` in one place.
- **`rmux.ts`:** `extends TmuxBackend` with `bin: "rmux"` and rmux's socket
  flag. It overrides only the places where rmux's command or format support
  differs. If the CLI turns out to lose too much information, it can use the
  structured snapshot API instead.
- **`cmux.ts`:** a JSON-RPC client over cmux's Unix socket.
  - A workspace maps to a window, and a surface maps to a pane.
  - `new-workspace` implements `newPane`, `send` implements `sendText`,
    `send-key` implements `sendKeys` (with key names translated), and
    `read-screen` implements `capture`.
  - It has no `pipeTo`: logs fall back to polling `capture`.
  - It has no live cwd, so the cwd is recorded at spawn.
  - The exact RPC method names still need checking against the official docs.

### `lib/mux/screen.ts` and `lib/mux/fleet.ts`

The classifiers are ported 1:1 as pure functions. `Fleet` wraps a
`MuxBackend` and provides the `PaneSender` surface: find, spawn,
`sendMessage`, `status`, `input`, `usageBlocked`, log arming and slots.

### Selection

`config/fleet.ts` builds the backend from `MUX_BACKEND=tmux|rmux|cmux`,
`MUX_SOCKET` and `MUX_BIN`. These move to a `Setting` row once trailmap owns
config as records. The default is tmux.

### Pane identity in scripts

`hooks/ringo-ask.sh`, `skills-link` and the archived skills read `$TMUX_PANE`
directly. They switch to a `paneId()` helper that knows each backend's
environment variable (for cmux, its surface ID).

## Hosting constraint

Trailmap runs in a dokku container, but the panes live on the host. The TS
backend needs:

- the multiplexer socket bind-mounted into the container,
- a matching client binary in the image, and
- `/mnt/theta/trails` mounted at the identical path, the same requirement
  btwhooks has today.

cmux is macOS-only, so the Linux dokku host cannot reach it. Supporting it
means running the `MuxBackend` in a small host-side pane agent that trailmap
calls over HTTP, which is the role ringo plays today. That agent may be the
right shape for every backend.

## Parity with the Go implementation

The Go tests are too thin to serve as the oracle, so parity is checked in
three layers.

1. **Shared screen fixtures.**
   - Build a corpus of real pane screens, sampled from live panes and taken
     from the session-archive pane logs. It lives in `parity/screens/`.
   - A Go program (`cmd/parity-dump`) runs each classifier, plus `slugify`,
     `shellQuote` and the chunking, over the corpus and writes
     `expected.json`.
   - The vitest suite must match it exactly. Regenerate whenever the Go code
     changes.
2. **Command-trace comparison.**
   - A fake `tmux` script on PATH logs every call as JSONL and replays canned
     output for `list-panes`, `capture-pane` and `new-window -P`.
   - The same scenarios run through Go `Sender` and TS `Fleet`: spawn worker,
     spawn reviewer (split), find by branch or PR, a long chunked message,
     cleanup, agent slots and log arming.
   - The two traces are diffed after pane ids and temp paths are normalized.
     This catches quoting, literal-flag and target-syntax drift.
3. **Shadow mode.**
   - TS `Fleet` runs read-only beside ringo. On each dashboard poll both
     compute status, input box, usage block and pane lookups for every pane.
   - Mismatches go to a `parity_mismatches` table, with the screen attached,
     and each one becomes a new fixture for layer 1.
   - Sending, spawning and killing move to TS one action at a time, behind a
     flag, only after a clean stretch.

**Exit criterion:** layers 1 and 2 are green in CI and shadow mode has a clean
stretch. Then ringo's `tmux/` package and the trace harness are deleted. From
then on rmux and cmux are checked against the TS tmux backend with a shared
contract suite, not against Go.

## Rollout

1. Add `backend.ts`, `tmux.ts`, the screen corpus, the `parity-dump` program
   and the `screen.ts` port.
2. Port `Fleet`, then add the trace harness and the differential test.
3. Settle host access, then run shadow mode and move writes over one action
   at a time.
4. Add the contract suite, then the rmux backend.
5. Add the cmux backend through the pane agent.
6. Retire ringo's `tmux/` package and its `main.go` wiring.

## Open questions

- In the container, or a host pane agent? The answer decides whether cmux is
  possible at all.
- Is rmux's tmux-format (`#{...}`) and `pipe-pane` support complete enough for
  `TmuxBackend` to be reused as-is?
- Should pane-log archiving be optional per backend, or must every backend
  provide some form of `pipeTo`?
