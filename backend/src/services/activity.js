export async function logActivity(client, data) {
  const {
    tenantId,
    projectId = null,
    userId = null,
    actionType,
    entityType,
    entityId = null,
    metadata = {},
  } = data;

  await client.query(
    `INSERT INTO activity_logs
      (tenant_id, project_id, user_id, action_type, entity_type, entity_id, metadata_json)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [tenantId, projectId, userId, actionType, entityType, entityId, metadata]
  );
}
