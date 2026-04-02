use std::{
    path::PathBuf,
    sync::{Arc, Mutex},
};

use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct BufferedTelemetryEvent {
    pub client_event_id: String,
    pub session_id: String,
    pub user_id: String,
    pub event_type: String,
    pub occurred_at: String,
    pub payload: Value,
    pub created_at: String,
    pub uploaded_at: Option<String>,
    pub upload_attempts: u32,
}

impl BufferedTelemetryEvent {
    pub fn to_batch_payload(&self) -> Value {
        serde_json::json!({
            "userId": self.user_id,
            "sessionId": self.session_id,
            "clientEventId": self.client_event_id,
            "source": "desktop",
            "type": self.event_type,
            "occurredAt": self.occurred_at,
            "receivedAt": self.created_at,
            "payload": self.payload,
        })
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct BufferHealth {
    pub max_events: usize,
    pub pending_events: usize,
    pub retained_uploaded_events: usize,
    pub total_events: usize,
    pub pruned_uploaded_events: u64,
    pub pruned_pending_events: u64,
    pub queue_warning: bool,
}

#[derive(Debug, Clone)]
struct BufferStats {
    pruned_uploaded_events: u64,
    pruned_pending_events: u64,
    queue_warning: bool,
}

#[derive(Clone)]
pub struct TelemetryBuffer {
    connection: Arc<Mutex<Connection>>,
    max_events: usize,
    uploaded_retention_seconds: u64,
    stats: Arc<Mutex<BufferStats>>,
}

impl TelemetryBuffer {
    pub fn new(
        file_path: PathBuf,
        max_events: usize,
        uploaded_retention_seconds: u64,
    ) -> anyhow::Result<Self> {
        let connection = Connection::open(file_path)?;
        connection.pragma_update(None, "journal_mode", "WAL")?;
        connection.pragma_update(None, "synchronous", "NORMAL")?;
        connection.execute_batch(
            r#"
            CREATE TABLE IF NOT EXISTS telemetry_buffer (
              client_event_id TEXT PRIMARY KEY,
              session_id TEXT NOT NULL,
              user_id TEXT NOT NULL,
              type TEXT NOT NULL,
              occurred_at TEXT NOT NULL,
              payload TEXT NOT NULL,
              created_at TEXT NOT NULL,
              uploaded_at TEXT,
              upload_attempts INTEGER NOT NULL DEFAULT 0
            );
            CREATE INDEX IF NOT EXISTS idx_telemetry_buffer_uploaded_at
              ON telemetry_buffer (uploaded_at, created_at);
            "#,
        )?;

        Ok(Self {
            connection: Arc::new(Mutex::new(connection)),
            max_events,
            uploaded_retention_seconds,
            stats: Arc::new(Mutex::new(BufferStats {
                pruned_uploaded_events: 0,
                pruned_pending_events: 0,
                queue_warning: false,
            })),
        })
    }

    pub fn insert(&self, event: &BufferedTelemetryEvent) -> anyhow::Result<()> {
        let connection = self.connection.lock().expect("buffer connection lock poisoned");
        connection.execute(
            r#"
            INSERT OR REPLACE INTO telemetry_buffer (
              client_event_id, session_id, user_id, type, occurred_at, payload, created_at, uploaded_at, upload_attempts
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
            "#,
            params![
                event.client_event_id,
                event.session_id,
                event.user_id,
                event.event_type,
                event.occurred_at,
                serde_json::to_string(&event.payload)?,
                event.created_at,
                event.uploaded_at,
                event.upload_attempts,
            ],
        )?;
        drop(connection);
        self.prune_if_needed()?;
        Ok(())
    }

    pub fn pending_batch(&self, limit: usize) -> anyhow::Result<Vec<BufferedTelemetryEvent>> {
        let connection = self.connection.lock().expect("buffer connection lock poisoned");
        let mut statement = connection.prepare(
            r#"
            SELECT client_event_id, session_id, user_id, type, occurred_at, payload, created_at, uploaded_at, upload_attempts
            FROM telemetry_buffer
            WHERE uploaded_at IS NULL
            ORDER BY created_at ASC
            LIMIT ?1
            "#,
        )?;
        let rows = statement.query_map(params![limit as i64], map_event_row)?;
        rows.collect::<Result<Vec<_>, _>>().map_err(Into::into)
    }

    pub fn mark_uploaded(&self, client_event_ids: &[String], uploaded_at: &str) -> anyhow::Result<()> {
        if client_event_ids.is_empty() {
            return Ok(());
        }

        let mut connection = self.connection.lock().expect("buffer connection lock poisoned");
        let transaction = connection.transaction()?;
        for client_event_id in client_event_ids {
            transaction.execute(
                "UPDATE telemetry_buffer SET uploaded_at = ?2 WHERE client_event_id = ?1",
                params![client_event_id, uploaded_at],
            )?;
        }
        transaction.commit()?;
        Ok(())
    }

    pub fn increment_attempts(&self, client_event_ids: &[String]) -> anyhow::Result<()> {
        if client_event_ids.is_empty() {
            return Ok(());
        }

        let mut connection = self.connection.lock().expect("buffer connection lock poisoned");
        let transaction = connection.transaction()?;
        for client_event_id in client_event_ids {
            transaction.execute(
                "UPDATE telemetry_buffer SET upload_attempts = upload_attempts + 1 WHERE client_event_id = ?1",
                params![client_event_id],
            )?;
        }
        transaction.commit()?;
        Ok(())
    }

    pub fn health(&self) -> anyhow::Result<BufferHealth> {
        let connection = self.connection.lock().expect("buffer connection lock poisoned");
        let total_events =
            connection.query_row("SELECT COUNT(*) FROM telemetry_buffer", [], |row| row.get::<_, i64>(0))?
                as usize;
        let pending_events = connection.query_row(
            "SELECT COUNT(*) FROM telemetry_buffer WHERE uploaded_at IS NULL",
            [],
            |row| row.get::<_, i64>(0),
        )? as usize;
        let retained_uploaded_events = connection.query_row(
            "SELECT COUNT(*) FROM telemetry_buffer WHERE uploaded_at IS NOT NULL",
            [],
            |row| row.get::<_, i64>(0),
        )? as usize;
        let stats = self.stats.lock().expect("buffer stats lock poisoned").clone();

        Ok(BufferHealth {
            max_events: self.max_events,
            pending_events,
            retained_uploaded_events,
            total_events,
            pruned_uploaded_events: stats.pruned_uploaded_events,
            pruned_pending_events: stats.pruned_pending_events,
            queue_warning: stats.queue_warning,
        })
    }

    fn prune_if_needed(&self) -> anyhow::Result<()> {
        self.prune_expired_uploaded()?;

        let health = self.health()?;
        if health.total_events <= self.max_events {
            return Ok(());
        }

        let overflow = health.total_events - self.max_events;
        let mut connection = self.connection.lock().expect("buffer connection lock poisoned");
        let transaction = connection.transaction()?;

        let uploaded_candidates = select_ids(
            &transaction,
            "SELECT client_event_id FROM telemetry_buffer WHERE uploaded_at IS NOT NULL ORDER BY uploaded_at ASC, created_at ASC LIMIT ?1",
            overflow,
        )?;

        let mut pruned_uploaded = 0_u64;
        let mut pruned_pending = 0_u64;

        for client_event_id in uploaded_candidates {
            transaction.execute(
                "DELETE FROM telemetry_buffer WHERE client_event_id = ?1",
                params![client_event_id],
            )?;
            pruned_uploaded += 1;
        }

        if pruned_uploaded < overflow as u64 {
            let pending_candidates = select_ids(
                &transaction,
                "SELECT client_event_id FROM telemetry_buffer WHERE uploaded_at IS NULL ORDER BY created_at ASC LIMIT ?1",
                overflow - pruned_uploaded as usize,
            )?;

            for client_event_id in pending_candidates {
                transaction.execute(
                    "DELETE FROM telemetry_buffer WHERE client_event_id = ?1",
                    params![client_event_id],
                )?;
                pruned_pending += 1;
            }
        }

        transaction.commit()?;
        drop(connection);

        if pruned_uploaded > 0 || pruned_pending > 0 {
            let mut stats = self.stats.lock().expect("buffer stats lock poisoned");
            stats.pruned_uploaded_events += pruned_uploaded;
            stats.pruned_pending_events += pruned_pending;
            if pruned_pending > 0 {
                stats.queue_warning = true;
            }
        }

        Ok(())
    }

    fn prune_expired_uploaded(&self) -> anyhow::Result<()> {
        let expiry_cutoff =
            (chrono::Utc::now() - chrono::Duration::seconds(self.uploaded_retention_seconds as i64))
                .to_rfc3339_opts(chrono::SecondsFormat::Millis, true);
        let connection = self.connection.lock().expect("buffer connection lock poisoned");
        connection.execute(
            "DELETE FROM telemetry_buffer WHERE uploaded_at IS NOT NULL AND uploaded_at < ?1",
            params![expiry_cutoff],
        )?;
        Ok(())
    }
}

fn select_ids(connection: &Connection, sql: &str, limit: usize) -> anyhow::Result<Vec<String>> {
    let mut statement = connection.prepare(sql)?;
    let rows = statement.query_map(params![limit as i64], |row| row.get::<_, String>(0))?;
    rows.collect::<Result<Vec<_>, _>>().map_err(Into::into)
}

fn map_event_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<BufferedTelemetryEvent> {
    let payload: String = row.get(5)?;
    let parsed_payload = serde_json::from_str(&payload).map_err(|error| {
        rusqlite::Error::FromSqlConversionFailure(
            5,
            rusqlite::types::Type::Text,
            Box::new(error),
        )
    })?;

    Ok(BufferedTelemetryEvent {
        client_event_id: row.get(0)?,
        session_id: row.get(1)?,
        user_id: row.get(2)?,
        event_type: row.get(3)?,
        occurred_at: row.get(4)?,
        payload: parsed_payload,
        created_at: row.get(6)?,
        uploaded_at: row.get(7)?,
        upload_attempts: row.get::<_, i64>(8)? as u32,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_buffer(max_events: usize) -> TelemetryBuffer {
        let path =
            std::env::temp_dir().join(format!("medstudy-buffer-{}.sqlite3", uuid::Uuid::new_v4()));
        TelemetryBuffer::new(path, max_events, 60).expect("buffer should initialize")
    }

    fn event(index: usize) -> BufferedTelemetryEvent {
        BufferedTelemetryEvent {
            client_event_id: format!("event_{index}"),
            session_id: "session_1".to_string(),
            user_id: "user_1".to_string(),
            event_type: "heartbeat".to_string(),
            occurred_at: format!("2026-04-02T10:00:{index:02}.000Z"),
            payload: serde_json::json!({ "index": index }),
            created_at: format!("2026-04-02T10:00:{index:02}.000Z"),
            uploaded_at: None,
            upload_attempts: 0,
        }
    }

    #[test]
    fn inserts_reads_and_marks_uploaded() {
        let buffer = test_buffer(10);
        buffer.insert(&event(1)).unwrap();
        buffer.insert(&event(2)).unwrap();

        let pending = buffer.pending_batch(50).unwrap();
        assert_eq!(pending.len(), 2);

        buffer
            .mark_uploaded(&[pending[0].client_event_id.clone()], "2026-04-02T10:05:00.000Z")
            .unwrap();

        let health = buffer.health().unwrap();
        assert_eq!(health.pending_events, 1);
        assert_eq!(health.retained_uploaded_events, 1);
    }

    #[test]
    fn prunes_uploaded_before_pending_when_overflowing() {
        let buffer = test_buffer(2);
        let mut uploaded = event(1);
        uploaded.uploaded_at = Some(
            chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true),
        );
        buffer.insert(&uploaded).unwrap();
        buffer.insert(&event(2)).unwrap();
        buffer.insert(&event(3)).unwrap();

        let health = buffer.health().unwrap();
        assert_eq!(health.total_events, 2);
        assert_eq!(health.pruned_uploaded_events, 1);
        assert_eq!(health.pruned_pending_events, 0);
    }

    #[test]
    fn surfaces_warning_when_pending_events_must_be_pruned() {
        let buffer = test_buffer(2);
        buffer.insert(&event(1)).unwrap();
        buffer.insert(&event(2)).unwrap();
        buffer.insert(&event(3)).unwrap();

        let health = buffer.health().unwrap();
        assert_eq!(health.total_events, 2);
        assert_eq!(health.pruned_pending_events, 1);
        assert!(health.queue_warning);
    }

    #[test]
    fn supports_concurrent_inserts() {
        let buffer = test_buffer(20);
        let mut handles = Vec::new();

        for index in 0..10 {
            let clone = buffer.clone();
            handles.push(std::thread::spawn(move || {
                clone.insert(&event(index)).unwrap();
            }));
        }

        for handle in handles {
            handle.join().unwrap();
        }

        assert_eq!(buffer.pending_batch(20).unwrap().len(), 10);
    }
}
