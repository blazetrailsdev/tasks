---
title: "action-controller-exceptions-invent-default-messages"
status: draft
updated: 2026-09-26
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the review of trails#8138. Several ActionController exception ports
invent a default message, or the wrong parent, where Rails declares a bare
subclass. A bare Ruby exception's message defaults to its class name
(`Exception#message` -> `to_s` -> class name when no message is given).

- `UnknownFormat`: Rails `vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/exceptions.rb:75-76`
  is bare. trails `packages/actionpack/src/action-controller/metal/exceptions.ts`
  defaults to `"Unknown format"`.
- `NotImplemented`: Rails `exceptions.rb:58-59` is `class NotImplemented < MethodNotAllowed`
  with no body, so it inherits `MethodNotAllowed#initialize(*allowed_methods)` (`:52-56`).
  trails extends `ActionControllerError` and defaults to `"Not Implemented"`.
- `MethodNotAllowed`: Rails builds the message with `allowed_methods.to_sentence` (`:54`).
  trails uses `allowedMethods.join(", ")`.
- `InvalidAuthenticityToken` / `InvalidCrossOriginRequest`: Rails
  `action_controller/metal/request_forgery_protection.rb:10-14` are bare.
  trails `metal/request-forgery-protection.ts` defaults to `"Invalid authenticity token"` /
  `"Invalid cross-origin request"`.

## Acceptance criteria

- Each class keeps Rails' parent, and a message-less raise gets Ruby's default
  (the class name), not an invented string.
- `NotImplemented` extends `MethodNotAllowed` and takes its constructor.
- `MethodNotAllowed`'s message uses ActiveSupport's `toSentence`.
- Existing raise sites that relied on the invented defaults pass the message Rails passes, if any.
