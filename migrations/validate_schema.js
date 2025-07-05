const { Client } = require('pg');

const config = {
  connectionString: 'postgresql://postgres:FaHfoxEmIwaAJuzOmQTOfStkainUxzzX@shortline.proxy.rlwy.net:28381/railway',
  ssl: {
    rejectUnauthorized: false
  }
};

const EXPECTED_SCHEMA = {
  vendor_invite_tokens: {
    columns: [
      { name: 'token_id', type: 'integer', nullable: false, isPk: true },
      { name: 'vendor_id', type: 'integer', nullable: false, isFk: true },
      { name: 'token', type: 'character varying', nullable: false },
      { name: 'created_at', type: 'timestamp with time zone', nullable: true },
      { name: 'expires_at', type: 'timestamp with time zone', nullable: false },
      { name: 'is_active', type: 'boolean', nullable: true },
      { name: 'last_accessed_at', type: 'timestamp with time zone', nullable: true }
    ],
    indices: [
      'idx_vendor_invite_tokens_token',
      'idx_vendor_invite_tokens_vendor_id'
    ]
  },
  enterprise_feedback: {
    columns: [
      { name: 'feedback_id', type: 'integer', nullable: false, isPk: true },
      { name: 'vendor_id', type: 'integer', nullable: false, isFk: true },
      { name: 'enterprise_name', type: 'character varying', nullable: false },
      { name: 'feedback_text', type: 'text', nullable: false },
      { name: 'rating', type: 'integer', nullable: true },
      { name: 'created_at', type: 'timestamp with time zone', nullable: true },
      { name: 'updated_at', type: 'timestamp with time zone', nullable: true },
      { name: 'status', type: 'character varying', nullable: true },
      { name: 'is_public', type: 'boolean', nullable: true }
    ],
    indices: [
      'idx_enterprise_feedback_vendor_id'
    ]
  },
  activities: {
    columns: [
      { name: 'activity_id', type: 'integer', nullable: false, isPk: true },
      { name: 'user_id', type: 'uuid', nullable: true },
      { name: 'activity_type', type: 'character varying', nullable: false },
      { name: 'entity_type', type: 'character varying', nullable: false },
      { name: 'entity_id', type: 'integer', nullable: false },
      { name: 'description', type: 'text', nullable: true },
      { name: 'created_at', type: 'timestamp with time zone', nullable: true },
      { name: 'metadata', type: 'jsonb', nullable: true }
    ],
    indices: [
      'idx_activities_user_id',
      'idx_activities_entity',
      'idx_activities_type'
    ]
  }
};

async function validateSchema() {
  const client = new Client(config);
  const report = {
    tables: {},
    deprecated_columns: [],
    missing_columns: [],
    type_mismatches: [],
    constraint_issues: [],
    index_issues: [],
    summary: {
      total_tables: 0,
      valid_tables: 0,
      tables_with_issues: 0
    }
  };
  
  try {
    await client.connect();
    console.log('Connected to database');

    // Get all tables
    const tables = Object.keys(EXPECTED_SCHEMA);
    report.summary.total_tables = tables.length;

    for (const table of tables) {
      report.tables[table] = { status: 'checking', issues: [] };

      // Check table existence
      const tableExists = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `, [table]);

      if (!tableExists.rows[0].exists) {
        report.tables[table].status = 'missing';
        report.tables[table].issues.push('Table does not exist');
        continue;
      }

      // Get column information
      const columns = await client.query(`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          (
            SELECT EXISTS (
              SELECT 1 FROM information_schema.table_constraints tc
              JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
              WHERE tc.table_name = c.table_name 
              AND kcu.column_name = c.column_name 
              AND tc.constraint_type = 'PRIMARY KEY'
            )
          ) as is_primary_key,
          (
            SELECT EXISTS (
              SELECT 1 FROM information_schema.table_constraints tc
              JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
              WHERE tc.table_name = c.table_name 
              AND kcu.column_name = c.column_name 
              AND tc.constraint_type = 'FOREIGN KEY'
            )
          ) as is_foreign_key
        FROM information_schema.columns c
        WHERE table_schema = 'public'
        AND table_name = $1
        ORDER BY ordinal_position
      `, [table]);

      // Check indices
      const indices = await client.query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = $1 
        AND schemaname = 'public'
      `, [table]);

      const indexNames = indices.rows.map(idx => idx.indexname);

      // Compare with expected schema
      const expectedColumns = EXPECTED_SCHEMA[table].columns;
      const expectedIndices = EXPECTED_SCHEMA[table].indices;

      // Check for deprecated columns
      columns.rows.forEach(col => {
        if (!expectedColumns.find(ec => ec.name === col.column_name)) {
          report.deprecated_columns.push(`${table}.${col.column_name}`);
          report.tables[table].issues.push(`Deprecated column: ${col.column_name}`);
        }
      });

      // Check for missing columns
      expectedColumns.forEach(ec => {
        const actualCol = columns.rows.find(c => c.column_name === ec.name);
        if (!actualCol) {
          report.missing_columns.push(`${table}.${ec.name}`);
          report.tables[table].issues.push(`Missing column: ${ec.name}`);
        } else {
          // Check type matches
          if (actualCol.data_type !== ec.type) {
            report.type_mismatches.push(`${table}.${ec.name}: expected ${ec.type}, got ${actualCol.data_type}`);
            report.tables[table].issues.push(`Type mismatch on ${ec.name}: expected ${ec.type}, got ${actualCol.data_type}`);
          }
          // Check constraints
          if (ec.isPk && !actualCol.is_primary_key) {
            report.constraint_issues.push(`${table}.${ec.name}: missing PRIMARY KEY constraint`);
            report.tables[table].issues.push(`Missing PRIMARY KEY constraint on ${ec.name}`);
          }
          if (ec.isFk && !actualCol.is_foreign_key) {
            report.constraint_issues.push(`${table}.${ec.name}: missing FOREIGN KEY constraint`);
            report.tables[table].issues.push(`Missing FOREIGN KEY constraint on ${ec.name}`);
          }
        }
      });

      // Check indices
      expectedIndices.forEach(ei => {
        if (!indexNames.includes(ei)) {
          report.index_issues.push(`${table}: missing index ${ei}`);
          report.tables[table].issues.push(`Missing index: ${ei}`);
        }
      });

      // Update table status
      report.tables[table].status = report.tables[table].issues.length === 0 ? 'valid' : 'issues';
    }

    // Update summary
    report.summary.valid_tables = Object.values(report.tables).filter(t => t.status === 'valid').length;
    report.summary.tables_with_issues = report.summary.total_tables - report.summary.valid_tables;

    // Generate report file
    const fs = require('fs');
    const reportPath = './migration-validation-report.md';
    
    let reportContent = '# Database Migration Validation Report\n\n';
    reportContent += `## Summary\n\n`;
    reportContent += `- Total tables checked: ${report.summary.total_tables}\n`;
    reportContent += `- Valid tables: ${report.summary.valid_tables}\n`;
    reportContent += `- Tables with issues: ${report.summary.tables_with_issues}\n\n`;

    reportContent += `## Detailed Findings\n\n`;
    
    if (report.deprecated_columns.length > 0) {
      reportContent += `### Deprecated Columns\n\n`;
      report.deprecated_columns.forEach(col => {
        reportContent += `- ${col}\n`;
      });
      reportContent += '\n';
    }

    if (report.missing_columns.length > 0) {
      reportContent += `### Missing Columns\n\n`;
      report.missing_columns.forEach(col => {
        reportContent += `- ${col}\n`;
      });
      reportContent += '\n';
    }

    if (report.type_mismatches.length > 0) {
      reportContent += `### Type Mismatches\n\n`;
      report.type_mismatches.forEach(mismatch => {
        reportContent += `- ${mismatch}\n`;
      });
      reportContent += '\n';
    }

    if (report.constraint_issues.length > 0) {
      reportContent += `### Constraint Issues\n\n`;
      report.constraint_issues.forEach(issue => {
        reportContent += `- ${issue}\n`;
      });
      reportContent += '\n';
    }

    if (report.index_issues.length > 0) {
      reportContent += `### Index Issues\n\n`;
      report.index_issues.forEach(issue => {
        reportContent += `- ${issue}\n`;
      });
      reportContent += '\n';
    }

    reportContent += `## Table Details\n\n`;
    Object.entries(report.tables).forEach(([tableName, details]) => {
      reportContent += `### ${tableName}\n\n`;
      reportContent += `Status: ${details.status}\n\n`;
      if (details.issues.length > 0) {
        reportContent += `Issues:\n`;
        details.issues.forEach(issue => {
          reportContent += `- ${issue}\n`;
        });
      } else {
        reportContent += `No issues found.\n`;
      }
      reportContent += '\n';
    });

    fs.writeFileSync(reportPath, reportContent);
    console.log(`\nValidation report generated: ${reportPath}`);

  } catch (error) {
    console.error('Error during schema validation:', error);
  } finally {
    await client.end();
    console.log('\nDatabase connection closed');
    return report;
  }
}

// Run the validation
validateSchema().catch(console.error); 