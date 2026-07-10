# Operational runbooks

## Schema deployment

Verify the immutable API image and migration bundle, take a backup, run the protected migration job with the direct endpoint and `vs_migrator`, inspect SQL/job logs, and only then deploy the API revision. Never run migrations from API startup.

## Rollback

Before PostgreSQL-only writes, switch to the recorded prior frontend/API revision and re-enable Firestore writes. After PostgreSQL accepts writes, stop and make an explicit reverse-data decision; a configuration toggle is not sufficient.

## Credential rotation and tenant deletion

Rotate Key Vault references through a new revision, validate readiness, revoke the old credential, and record the time. For tenant export/deletion, authorize the operation at the API boundary, export only that practice's rows/files, verify references, then delete in a transaction and retain an audit record without sensitive payloads.
