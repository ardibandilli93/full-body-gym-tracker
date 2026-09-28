import type { AppSnapshot, RoutinePlan, UserProfile, WorkoutSession } from '@/domain/types';
import { getDatabase } from './database';

type QueueOperation = 'upsert' | 'delete';
type QueueEntity = 'profile' | 'plan' | 'workout_session';

export type SyncQueueItem = {
  id: number;
  ownerId: string;
  entityType: QueueEntity;
  entityId: string;
  operation: QueueOperation;
  payloadJson: string;
  attempts: number;
};

async function enqueue(
  ownerId: string,
  entityType: QueueEntity,
  entityId: string,
  operation: QueueOperation,
  payload: unknown,
): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(
    `INSERT INTO sync_queue
      (owner_id, entity_type, entity_id, operation, payload_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?)`,
    ownerId,
    entityType,
    entityId,
    operation,
    JSON.stringify(payload),
    new Date().toISOString(),
  );
}

export const appRepository = {
  async deleteOwnerData(ownerId: string): Promise<void> {
    const database = await getDatabase();
    await database.withTransactionAsync(async () => {
      await database.runAsync('DELETE FROM sync_queue WHERE owner_id = ?', ownerId);
      await database.runAsync('DELETE FROM workout_sessions WHERE owner_id = ?', ownerId);
      await database.runAsync('DELETE FROM plans WHERE owner_id = ?', ownerId);
      await database.runAsync('DELETE FROM profiles WHERE owner_id = ?', ownerId);
    });
  },

  async loadSnapshot(ownerId: string): Promise<AppSnapshot> {
    const database = await getDatabase();
    const [profileRow, planRow, sessionRows] = await Promise.all([
      database.getFirstAsync<{ payload_json: string }>(
        'SELECT payload_json FROM profiles WHERE owner_id = ?',
        ownerId,
      ),
      database.getFirstAsync<{ payload_json: string }>(
        'SELECT payload_json FROM plans WHERE owner_id = ? AND is_active = 1 ORDER BY updated_at DESC LIMIT 1',
        ownerId,
      ),
      database.getAllAsync<{ payload_json: string }>(
        'SELECT payload_json FROM workout_sessions WHERE owner_id = ? ORDER BY started_at DESC',
        ownerId,
      ),
    ]);

    return {
      profile: profileRow ? JSON.parse(profileRow.payload_json) as UserProfile : null,
      activePlan: planRow ? JSON.parse(planRow.payload_json) as RoutinePlan : null,
      sessions: sessionRows.map((row) => JSON.parse(row.payload_json) as WorkoutSession),
    };
  },

  async saveProfile(ownerId: string, profile: UserProfile, shouldQueue = true): Promise<void> {
    const database = await getDatabase();
    await database.runAsync(
      `INSERT INTO profiles (owner_id, payload_json, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(owner_id) DO UPDATE SET
         payload_json = excluded.payload_json,
         updated_at = excluded.updated_at`,
      ownerId,
      JSON.stringify(profile),
      profile.updatedAt,
    );
    if (shouldQueue) await enqueue(ownerId, 'profile', profile.id, 'upsert', profile);
  },

  async savePlan(ownerId: string, plan: RoutinePlan, shouldQueue = true): Promise<void> {
    const database = await getDatabase();
    await database.withTransactionAsync(async () => {
      await database.runAsync('UPDATE plans SET is_active = 0 WHERE owner_id = ?', ownerId);
      await database.runAsync(
        `INSERT INTO plans (id, owner_id, payload_json, is_active, revision, updated_at)
         VALUES (?, ?, ?, 1, 1, ?)
         ON CONFLICT(id) DO UPDATE SET
           payload_json = excluded.payload_json,
           is_active = 1,
           revision = plans.revision + 1,
           updated_at = excluded.updated_at`,
        plan.id,
        ownerId,
        JSON.stringify(plan),
        plan.updatedAt,
      );
    });
    if (shouldQueue) await enqueue(ownerId, 'plan', plan.id, 'upsert', plan);
  },

  async saveSession(ownerId: string, session: WorkoutSession, shouldQueue = true): Promise<void> {
    const database = await getDatabase();
    await database.runAsync(
      `INSERT INTO workout_sessions
        (id, owner_id, local_date, plan_day_id, status, payload_json, revision, sync_state, started_at, finished_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         local_date = excluded.local_date,
         plan_day_id = excluded.plan_day_id,
         status = excluded.status,
         payload_json = excluded.payload_json,
         revision = workout_sessions.revision + 1,
         sync_state = excluded.sync_state,
         finished_at = excluded.finished_at,
         updated_at = excluded.updated_at`,
      session.id,
      ownerId,
      session.localDate,
      session.planDayId,
      session.status,
      JSON.stringify(session),
      shouldQueue ? 'pending' : 'synced',
      session.startedAt,
      session.finishedAt,
      session.updatedAt,
    );
    if (shouldQueue) await enqueue(ownerId, 'workout_session', session.id, 'upsert', session);
  },

  async pendingSync(ownerId: string, limit = 50): Promise<SyncQueueItem[]> {
    const database = await getDatabase();
    const rows = await database.getAllAsync<{
      id: number;
      owner_id: string;
      entity_type: QueueEntity;
      entity_id: string;
      operation: QueueOperation;
      payload_json: string;
      attempts: number;
    }>(
      `SELECT id, owner_id, entity_type, entity_id, operation, payload_json, attempts
       FROM sync_queue WHERE owner_id = ? ORDER BY created_at LIMIT ?`,
      ownerId,
      limit,
    );
    return rows.map((row) => ({
      id: row.id,
      ownerId: row.owner_id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      operation: row.operation,
      payloadJson: row.payload_json,
      attempts: row.attempts,
    }));
  },

  async markSynced(queueId: number, entityId?: string): Promise<void> {
    const database = await getDatabase();
    await database.withTransactionAsync(async () => {
      await database.runAsync('DELETE FROM sync_queue WHERE id = ?', queueId);
      if (entityId) {
        await database.runAsync("UPDATE workout_sessions SET sync_state = 'synced' WHERE id = ?", entityId);
      }
    });
  },

  async markSyncFailed(queueId: number, message: string): Promise<void> {
    const database = await getDatabase();
    await database.runAsync(
      'UPDATE sync_queue SET attempts = attempts + 1, last_error = ? WHERE id = ?',
      message.slice(0, 500),
      queueId,
    );
  },
};
