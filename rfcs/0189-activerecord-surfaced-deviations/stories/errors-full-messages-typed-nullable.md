---
title: "Errors#fullMessages is typed (string | null)[] where Rails answers Strings"
status: draft
updated: 2026-11-20
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: ["activemodel"]
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveModel::Errors#full_messages` is `@errors.map(&:full_message)` (`vendor/rails/v8.0.2/activemodel/lib/active_model/errors.rb:415-418`), and `Error#full_message` always answers a String (`Error.full_message`, `vendor/rails/v8.0.2/activemodel/lib/active_model/error.rb`), so Rails' `full_messages` is an Array of Strings. trails types it wider: `get fullMessages(): (string | null)[]` (`packages/activemodel/lib/errors.ts:231`), `fullMessagesFor` / `messagesFor` likewise (`:235`, `:239`), from `Error#fullMessage(): string | null` (`packages/activemodel/lib/error.ts:257`, and the static overload at `:85`).

Every consumer carries the `null`: `examples/react-native-notes/App.tsx` (trails#10425) has to hold validation messages as `useState<(string | null)[]>` to accept `notebook.errors.fullMessages`.

## Acceptance criteria

- `Error#fullMessage`, `Errors#fullMessages`, `#fullMessagesFor` and `#messagesFor` are typed `string` / `string[]` as Rails answers them, with whatever path produces a `null` today converged to Rails' String result (or, if a `nil` message is genuinely reachable in Rails, cited at its Rails line).
- `examples/react-native-notes/App.tsx` holds its messages as `string[]` with no widening.
