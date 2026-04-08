# Backend Down

## Meaning

The backend process is not responding to `/health` for more than 60 seconds.

## Likely causes

- container crash or restart loop
- bad deploy image
- startup config validation failure
- host resource exhaustion

## Diagnostics

1. Check container status and restart count.
2. Inspect recent backend logs for startup failures or uncaught exceptions.
3. Hit `/health` locally on the host if possible.
4. Confirm the latest deploy and image tag.

## Remediation

1. Roll back to the previous known-good image if the issue started after deploy.
2. Fix missing or invalid env config if startup validation failed.
3. Restart the backend container once after confirming the root cause.

## Escalation

Escalate if rollback does not restore `/health` within 15 minutes.
