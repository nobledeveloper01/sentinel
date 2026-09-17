# ADR-0010 — Places the phone keeps are never sent

## Status

Accepted, 2026-09-17.

## Context

A journey is typed every time: where, in how many minutes, who to tell.
Twenty seconds, and the same twenty seconds on the same road every night.
ADR-0006 #2 asked for templates — *home from Ikeja* as one tap — and #21 for
safe places: the user's own list of a police post, a hospital, an aunt's
shop, offered as destinations and shown on the alert screen beside the
official numbers.

The obvious implementation puts both on the server, so they survive a
reinstall. A list of the places a person goes and the places they run to is
the most sensitive thing this product could hold, and the server already
holds nothing it can read about where anyone is. Syncing these would be the
first exception, and the exception would be the pattern of a life.

## Decision

**Templates and safe places live on the phone, in the app's state, and are
never sent anywhere.** A template is a label, the usual minutes and the
members to tell; a safe place is a label. Both are lists the user edits in
Settings; the journey screen offers the templates as one tap and the safe
places as destinations; the alert screen lists the safe places beneath the
numbers. The privacy card counts them as *places, kept on this phone only*.

**A safe place is not a claim about safety.** It is where the user said they
would go. The app does not rank them, route to them, or suggest one; a
suggestion is a claim the app cannot stand behind at three in the morning.

**No crowd-sourcing, ever.** A shared list of safe places is a map of where
people will be, which is a map for the wrong reader.

## Consequences

A reinstall loses the lists, and the privacy card says so, because the
alternative is a server that knows where a person sleeps. The journey the
template starts is an ordinary journey; the server's copy is the escalation
minute and whom to tell, as before, and never the label.
