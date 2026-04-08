# MedStudy OS Student Guide

## What this system is

MedStudy OS is a study-enforcement system for planned study sessions.

It is designed to:

- track contract-based study sessions
- monitor session status during study
- require checkpoints and artifacts when applicable
- produce explainable outcomes
- keep an audit trail of what happened

## What this system is not

It is not:

- a general productivity app
- a timer that you can freely override
- a system where the phone or desktop decides outcomes on its own
- a replacement for your clinical or academic judgment

The backend is the final authority for session truth and outcomes.

## What the desktop app does

The desktop app is the primary runtime app during study.

It is used to:

- restore and show the current session
- reflect session state changes from the backend
- capture study-related runtime telemetry during active sessions
- show warnings and status changes while you study

If you are in a real study session, the desktop app should be running unless your supervisor/operator told you otherwise.

## What the mobile app does

The mobile app is a companion app.

It is used to:

- view session status
- handle checkpoints
- submit artifacts
- view results
- view progress, streaks, and XP

The mobile app does not replace the desktop app as the monitoring authority.

## What is monitored and what is not monitored

At a high level, the system monitors:

- session state
- checkpoint completion
- submitted artifacts
- desktop runtime telemetry relevant to session integrity
- backend review and scoring outputs

It does not rely on the mobile app as the final authority for:

- starting or ending outcomes
- deciding pass/fail
- deciding penalties

## How to prepare before a session

Before each session:

- make sure your desktop app is installed and updated
- make sure you can log in
- make sure your internet connection is stable if possible
- close unrelated work that would obviously conflict with the session contract
- read the contract or session objective before starting
- have anything needed for artifacts ready in advance
- keep your phone available if checkpoints or artifact submission may be needed

## How to arm and start a session

Typical flow:

1. Open the desktop app.
2. Restore or open the planned session.
3. Confirm the correct title, objective, and contract are shown.
4. Follow the app prompts to arm and start the session.
5. Begin studying only after the session has entered its active state.

Do not assume a session is active just because you opened the app. Check the displayed state.

## What happens during an active session

During an active session:

- the desktop app remains the main runtime companion
- the backend continues to own the session truth
- telemetry may be processed and may raise warnings
- checkpoints may become due
- artifacts may be required before review can complete cleanly

You should keep working normally, but pay attention to warnings and checkpoint prompts.

## How checkpoints work

Checkpoints are part of the session contract and review trail.

When a checkpoint is due:

- you should respond from the supported surface, usually mobile or the relevant session screen
- complete it honestly and on time
- include a note if the prompt asks for one or if clarification helps

Missing or repeatedly failing checkpoints can affect the session outcome.

## How to submit artifacts

Artifacts are evidence or outputs connected to the session.

Typical artifact submission rules:

- give the artifact a clear title
- include a short description if it helps explain what it is
- submit it before the session review is finalized if the contract requires it
- use the mobile app's supported artifact flow

If an artifact is required and missing, the session can fail or remain incomplete depending on backend rules.

## What warnings mean

A warning means the system detected something that may put the session at risk.

Warnings do not always mean automatic failure, but they do mean:

- the session may be moved into a warning state
- the event will be part of the audit trail
- repeated or severe issues may escalate review or penalties

If a warning appears, continue carefully and do not try to game the system.

## What happens if focus is lost or telemetry is interrupted

If focus is lost or telemetry is interrupted:

- the desktop app may show a warning or degraded status
- the backend may later reflect a warning, pause-related state, or review concern
- the session outcome is still decided by backend review, not by the client alone

What you should do:

- return to the intended study activity immediately
- restore connectivity if possible
- do not hide or work around the interruption
- document what happened if it was a genuine technical issue

## What `review_pending` means

`review_pending` means the live study portion is over and the session is waiting for backend review/finalization.

This does not mean the outcome is complete yet.

During `review_pending`:

- the backend may still validate artifacts, checkpoints, and review inputs
- the final outcome is not settled until backend review completes
- you should not assume the session passed just because active study ended

## How outcomes are decided at a high level

At a high level, the backend decides outcomes using:

- session state history
- contract rules
- scoring inputs
- checkpoint status
- artifacts
- telemetry and anti-avoidance signals
- any required review steps

The system is designed to explain why a session ended the way it did.

## What to do if something seems wrong

If something seems wrong:

- do not guess or force a workaround
- take a screenshot if possible
- note the time
- note the session title or session ID if visible
- contact the operator or supervisor
- avoid changing the situation further unless you are told to do so

## What to do if internet drops

If the internet drops:

- keep the desktop app open if it is still running
- reconnect as soon as possible
- use offline-safe mobile actions only if the app clearly says they can be queued
- do not assume offline actions are final until the backend confirms them

Some actions may be delayed or blocked while offline. The backend still decides the final truth after reconnect.

## What to do if the app crashes

If the desktop or mobile app crashes:

- reopen it as soon as possible
- restore the current session if prompted
- take note of the crash time
- report repeated crashes to the operator

Do not assume a crash erased the session. The backend may still have the session state.

## How streaks, XP, and progress work

Progress features are downstream summaries. They are not the authority for session outcomes.

At a high level:

- completed sessions may produce stronger rewards
- partial sessions may produce reduced rewards
- failed or penalized sessions may produce no reward
- progress is shown after backend processing

Treat streaks and XP as context, not as the reason to bypass contract rules.

## Privacy and transparency notes

This system is designed to be explicit rather than hidden.

Important points:

- the backend is the final source of truth
- the desktop app is the primary runtime monitoring surface during study
- results should be explainable through timeline, scoring, and contract evaluation
- admin actions are auditable

If you do not understand why a session ended a certain way, ask for the explainable review rather than guessing.

## Do

- prepare before starting
- keep the desktop app running during real sessions
- respond to checkpoints honestly
- submit required artifacts on time
- report technical issues quickly
- treat warnings seriously

## Don't

- assume the phone can authoritatively fix a session outcome
- ignore warnings and continue as if nothing happened
- submit fake or misleading artifacts
- try to work around telemetry or monitoring
- assume `review_pending` means success
- keep silent about crashes or connectivity problems that affected the session
