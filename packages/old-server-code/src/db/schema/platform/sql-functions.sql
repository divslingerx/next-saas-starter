-- ==========================================
-- Platform SQL Functions and Views
-- Performance-optimized helpers for common operations
-- ==========================================

-- ==========================================
-- FUNCTIONS
-- ==========================================

-- Get record with all properties (merges defaults with values)
CREATE OR REPLACE FUNCTION get_record_with_properties(
  p_record_id INTEGER,
  p_organization_id TEXT
) RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'id', r.id,
    'objectType', r.object_type,
    'properties', COALESCE(
      jsonb_merge_recursive(
        od.default_properties,
        COALESCE(oos.property_definitions, '{}'::jsonb),
        COALESCE(r.properties, '{}'::jsonb)
      ),
      '{}'::jsonb
    ),
    'createdAt', r.created_at,
    'updatedAt', r.updated_at
  ) INTO v_result
  FROM cl_record r
  INNER JOIN cl_object_definition od ON od.object_type = r.object_type
  LEFT JOIN cl_organization_object_schema oos ON 
    oos.organization_id = r.organization_id AND 
    oos.object_type = r.object_type
  WHERE r.id = p_record_id
    AND r.organization_id = p_organization_id;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;

-- Search records by property value
CREATE OR REPLACE FUNCTION search_records_by_property(
  p_organization_id TEXT,
  p_object_type TEXT,
  p_property_name TEXT,
  p_property_value TEXT,
  p_limit INTEGER DEFAULT 100
) RETURNS TABLE(
  record_id INTEGER,
  properties JSONB,
  score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id AS record_id,
    r.properties,
    similarity(r.properties->>p_property_name, p_property_value) AS score
  FROM cl_record r
  WHERE r.organization_id = p_organization_id
    AND r.object_type = p_object_type
    AND r.properties ? p_property_name
  ORDER BY score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get record associations with details
CREATE OR REPLACE FUNCTION get_record_associations(
  p_record_id INTEGER
) RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'from', (
      SELECT json_agg(json_build_object(
        'id', a.id,
        'typeId', at.type_id,
        'typeName', at.name,
        'label', COALESCE(al.label, at.label),
        'toRecordId', a.to_record_id,
        'properties', a.properties
      ))
      FROM cl_association a
      INNER JOIN cl_association_type at ON at.type_id = a.type_id
      LEFT JOIN cl_organization_association_label al ON 
        al.organization_id = a.organization_id AND
        al.type_id = a.type_id
      WHERE a.from_record_id = p_record_id
    ),
    'to', (
      SELECT json_agg(json_build_object(
        'id', a.id,
        'typeId', at.type_id,
        'typeName', at.name,
        'label', COALESCE(al.label, at.inverse_label),
        'fromRecordId', a.from_record_id,
        'properties', a.properties
      ))
      FROM cl_association a
      INNER JOIN cl_association_type at ON at.type_id = a.type_id
      LEFT JOIN cl_organization_association_label al ON 
        al.organization_id = a.organization_id AND
        al.type_id = a.type_id
      WHERE a.to_record_id = p_record_id
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;

-- Bulk update properties
CREATE OR REPLACE FUNCTION bulk_update_properties(
  p_organization_id TEXT,
  p_record_ids INTEGER[],
  p_properties JSONB
) RETURNS INTEGER AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  UPDATE cl_record
  SET 
    properties = properties || p_properties,
    updated_at = CURRENT_TIMESTAMP
  WHERE organization_id = p_organization_id
    AND id = ANY(p_record_ids);
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  -- Log to audit
  INSERT INTO cl_audit_log (
    organization_id,
    entity_type,
    action,
    action_details,
    new_values,
    user_id
  )
  VALUES (
    p_organization_id,
    'record',
    'bulk_update',
    format('Updated %s records', v_updated_count),
    p_properties,
    current_setting('app.current_user_id', true)
  );
  
  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- VIEWS
-- ==========================================

-- Active records by object type
CREATE OR REPLACE VIEW v_active_records AS
SELECT 
  r.organization_id,
  r.object_type,
  od.label AS object_label,
  COUNT(*) AS record_count,
  MAX(r.created_at) AS last_created,
  MAX(r.updated_at) AS last_updated
FROM cl_record r
INNER JOIN cl_object_definition od ON od.object_type = r.object_type
WHERE r.deleted_at IS NULL
GROUP BY r.organization_id, r.object_type, od.label;

-- Pipeline performance view
CREATE OR REPLACE VIEW v_pipeline_performance AS
SELECT
  p.id AS pipeline_id,
  p.name AS pipeline_name,
  p.organization_id,
  COUNT(DISTINCT rs.record_id) AS total_records,
  AVG(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - rs.entered_at))/86400)::INTEGER AS avg_days_in_pipeline,
  COUNT(DISTINCT CASE 
    WHEN rs.stage_id = ANY((p.stages->>'completedStages')::text[]) 
    THEN rs.record_id 
  END) AS completed_records
FROM cl_pipeline p
LEFT JOIN cl_record_stage rs ON rs.pipeline_id = p.id
GROUP BY p.id, p.name, p.organization_id;

-- List membership counts
CREATE OR REPLACE VIEW v_list_membership_stats AS
SELECT
  l.id AS list_id,
  l.name AS list_name,
  l.organization_id,
  l.type AS list_type,
  COUNT(lm.record_id) AS member_count,
  COUNT(CASE WHEN lm.is_pinned THEN 1 END) AS pinned_count,
  COUNT(CASE WHEN lm.is_excluded THEN 1 END) AS excluded_count,
  MAX(lm.added_at) AS last_member_added
FROM cl_list l
LEFT JOIN cl_list_membership lm ON lm.list_id = l.id
GROUP BY l.id, l.name, l.organization_id, l.type;

-- ==========================================
-- MATERIALIZED VIEWS
-- ==========================================

-- Record search index (refresh periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_record_search_index AS
SELECT
  r.id,
  r.organization_id,
  r.object_type,
  r.properties->>'name' AS name,
  r.properties->>'email' AS email,
  r.properties->>'company' AS company,
  to_tsvector('english', COALESCE(
    r.properties->>'name', '') || ' ' ||
    COALESCE(r.properties->>'email', '') || ' ' ||
    COALESCE(r.properties->>'company', '') || ' ' ||
    COALESCE(r.properties->>'description', '')
  ) AS search_vector,
  r.created_at,
  r.updated_at
FROM cl_record r
WHERE r.deleted_at IS NULL;

CREATE INDEX idx_mv_record_search_vector ON mv_record_search_index USING gin(search_vector);
CREATE INDEX idx_mv_record_search_org ON mv_record_search_index(organization_id, object_type);

-- Association graph for relationship queries
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_association_graph AS
SELECT
  a.organization_id,
  a.from_record_id,
  fr.object_type AS from_object_type,
  a.to_record_id,
  tr.object_type AS to_object_type,
  a.type_id,
  at.name AS association_name,
  at.cardinality,
  a.created_at
FROM cl_association a
INNER JOIN cl_record fr ON fr.id = a.from_record_id
INNER JOIN cl_record tr ON tr.id = a.to_record_id
INNER JOIN cl_association_type at ON at.type_id = a.type_id
WHERE a.deleted_at IS NULL;

CREATE INDEX idx_mv_assoc_from ON mv_association_graph(from_record_id);
CREATE INDEX idx_mv_assoc_to ON mv_association_graph(to_record_id);
CREATE INDEX idx_mv_assoc_type ON mv_association_graph(type_id);

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Safe counter update with advisory locks
CREATE OR REPLACE FUNCTION safe_update_list_member_count(p_list_id INTEGER)
RETURNS VOID AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('list_count_' || p_list_id));
  
  UPDATE cl_list 
  SET member_count = (
    SELECT COUNT(*) 
    FROM cl_list_membership 
    WHERE list_id = p_list_id AND is_excluded = false
  ),
  updated_at = CURRENT_TIMESTAMP
  WHERE id = p_list_id;
END;
$$ LANGUAGE plpgsql;

-- Safe pipeline record count update
CREATE OR REPLACE FUNCTION safe_update_pipeline_record_count(p_pipeline_id INTEGER)
RETURNS VOID AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('pipeline_count_' || p_pipeline_id));
  
  UPDATE cl_pipeline 
  SET record_count = (
    SELECT COUNT(DISTINCT record_id) 
    FROM cl_record_stage 
    WHERE pipeline_id = p_pipeline_id
  ),
  updated_at = CURRENT_TIMESTAMP
  WHERE id = p_pipeline_id;
END;
$$ LANGUAGE plpgsql;

-- Batch counter update for performance
CREATE OR REPLACE FUNCTION batch_update_counters()
RETURNS VOID AS $$
BEGIN
  -- Update all list counts in a single transaction
  WITH list_counts AS (
    SELECT 
      lm.list_id,
      COUNT(*) as actual_count
    FROM cl_list_membership lm
    WHERE lm.is_excluded = false
    GROUP BY lm.list_id
  )
  UPDATE cl_list l
  SET 
    member_count = COALESCE(lc.actual_count, 0),
    updated_at = CURRENT_TIMESTAMP
  FROM list_counts lc
  WHERE l.id = lc.list_id;
  
  -- Update pipeline counts
  WITH pipeline_counts AS (
    SELECT 
      rs.pipeline_id,
      COUNT(DISTINCT rs.record_id) as actual_count
    FROM cl_record_stage rs
    GROUP BY rs.pipeline_id
  )
  UPDATE cl_pipeline p
  SET 
    record_count = COALESCE(pc.actual_count, 0),
    updated_at = CURRENT_TIMESTAMP
  FROM pipeline_counts pc
  WHERE p.id = pc.pipeline_id;
END;
$$ LANGUAGE plpgsql;

-- Replace unsafe triggers with safe function calls
CREATE OR REPLACE FUNCTION trigger_safe_list_count_update()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM safe_update_list_member_count(NEW.list_id);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM safe_update_list_member_count(OLD.list_id);
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM safe_update_list_member_count(NEW.list_id);
    IF NEW.list_id != OLD.list_id THEN
      PERFORM safe_update_list_member_count(OLD.list_id);
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop old trigger and create new safe one
DROP TRIGGER IF EXISTS trg_update_list_member_count ON cl_list_membership;

CREATE TRIGGER trg_safe_list_member_count
AFTER INSERT OR UPDATE OR DELETE ON cl_list_membership
FOR EACH ROW EXECUTE FUNCTION trigger_safe_list_count_update();

-- Auto-log property changes
CREATE OR REPLACE FUNCTION log_property_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.properties IS DISTINCT FROM NEW.properties THEN
    INSERT INTO cl_property_history (
      record_id,
      object_type,
      property_name,
      previous_value,
      new_value,
      changed_by_id
    )
    SELECT
      NEW.id,
      NEW.object_type,
      key,
      OLD.properties->key,
      NEW.properties->key,
      current_setting('app.current_user_id', true)
    FROM jsonb_each(NEW.properties)
    WHERE OLD.properties->key IS DISTINCT FROM NEW.properties->key;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_log_property_changes
AFTER UPDATE ON cl_record
FOR EACH ROW 
WHEN (OLD.properties IS DISTINCT FROM NEW.properties)
EXECUTE FUNCTION log_property_changes();

-- ==========================================
-- HELPER FUNCTIONS
-- ==========================================

-- JSONB recursive merge
CREATE OR REPLACE FUNCTION jsonb_merge_recursive(target JSONB, VARIADIC sources JSONB[])
RETURNS JSONB AS $$
DECLARE
  source JSONB;
  result JSONB := target;
BEGIN
  FOREACH source IN ARRAY sources
  LOOP
    result := result || source;
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Generate object type ID
CREATE OR REPLACE FUNCTION generate_object_type_id()
RETURNS TEXT AS $$
DECLARE
  v_max_id INTEGER;
BEGIN
  SELECT MAX(SPLIT_PART(object_type_id, '-', 2)::INTEGER)
  INTO v_max_id
  FROM cl_object_definition
  WHERE object_type_id LIKE '2-%';
  
  RETURN '2-' || COALESCE(v_max_id + 1, 1);
END;
$$ LANGUAGE plpgsql;

-- Refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_record_search_index;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_association_graph;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- AUDIT PARTITIONING
-- ==========================================

-- Create monthly audit partition
CREATE OR REPLACE FUNCTION create_audit_partition(partition_date DATE)
RETURNS TEXT AS $$
DECLARE
  partition_name TEXT;
  start_date DATE;
  end_date DATE;
BEGIN
  -- Calculate partition bounds (monthly)
  start_date := DATE_TRUNC('month', partition_date);
  end_date := start_date + INTERVAL '1 month';
  
  -- Generate partition name
  partition_name := 'cl_audit_log_' || TO_CHAR(start_date, 'YYYY_MM');
  
  -- Create partition table
  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I PARTITION OF cl_audit_log
    FOR VALUES FROM (%L) TO (%L)',
    partition_name, start_date, end_date
  );
  
  -- Add indexes to partition
  EXECUTE format('
    CREATE INDEX IF NOT EXISTS %I ON %I (organization_id, created_at)',
    partition_name || '_org_time_idx', partition_name
  );
  
  EXECUTE format('
    CREATE INDEX IF NOT EXISTS %I ON %I (entity_type, entity_id)',
    partition_name || '_entity_idx', partition_name
  );
  
  RETURN partition_name;
END;
$$ LANGUAGE plpgsql;

-- Automatic partition creation
CREATE OR REPLACE FUNCTION ensure_audit_partitions()
RETURNS VOID AS $$
DECLARE
  current_month DATE;
  next_month DATE;
  partition_name TEXT;
BEGIN
  current_month := DATE_TRUNC('month', CURRENT_DATE);
  next_month := current_month + INTERVAL '1 month';
  
  -- Create current month partition if not exists
  SELECT create_audit_partition(current_month) INTO partition_name;
  RAISE NOTICE 'Ensured partition: %', partition_name;
  
  -- Create next month partition for smooth transitions
  SELECT create_audit_partition(next_month) INTO partition_name;
  RAISE NOTICE 'Ensured partition: %', partition_name;
END;
$$ LANGUAGE plpgsql;

-- Partition cleanup (remove old partitions)
CREATE OR REPLACE FUNCTION cleanup_old_audit_partitions(retention_months INTEGER DEFAULT 12)
RETURNS INTEGER AS $$
DECLARE
  partition_record RECORD;
  cutoff_date DATE;
  dropped_count INTEGER := 0;
BEGIN
  cutoff_date := DATE_TRUNC('month', CURRENT_DATE) - (retention_months || ' months')::INTERVAL;
  
  -- Find and drop old partitions
  FOR partition_record IN
    SELECT schemaname, tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename ~ '^cl_audit_log_\d{4}_\d{2}$'
    AND TO_DATE(RIGHT(tablename, 7), 'YYYY_MM') < cutoff_date
  LOOP
    EXECUTE format('DROP TABLE IF EXISTS %I.%I', partition_record.schemaname, partition_record.tablename);
    RAISE NOTICE 'Dropped old partition: %', partition_record.tablename;
    dropped_count := dropped_count + 1;
  END LOOP;
  
  RETURN dropped_count;
END;
$$ LANGUAGE plpgsql;