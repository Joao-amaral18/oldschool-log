# Database Migration Guide: Add Range Support

This guide shows you how to update your existing Supabase database to support ranges for sets, reps, and rest times.

## What This Migration Does

- Changes `sets`, `reps`, `rest_sec` from `integer` to `varchar(50)` to support ranges like "8-12"
- Makes `load` column nullable in both tables
- Converts existing numeric data to strings for backward compatibility

## Migration Options

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. First, copy and paste the contents of `check_constraints.sql`
4. Run it to see if there are conflicting constraints
5. Copy and paste the contents of `complete_migration.sql` (handles constraints automatically)
6. Execute the migration

### Quick Migration (if you know there are constraints)

If you're confident there are constraint conflicts, use this approach:

1. Copy and paste the contents of `drop_constraints.sql`
2. Run it to drop conflicting constraints
3. Copy and paste the contents of `fixed_migration.sql`
4. Execute the migration

### Option 2: Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db push

# Or create a migration file
supabase migration new update_columns_to_varchar
# Then edit the generated file with the migration SQL
```

### Option 3: Direct SQL Execution

Run `migration_update_columns.sql` or `quick_migration.sql` directly in your database.

## Files Created

- `check_migration_status.sql` - Check current database state
- `check_constraints.sql` - Check for conflicting constraints
- `drop_constraints.sql` - Drop constraints that conflict with varchar conversion
- `complete_migration.sql` - **Recommended** - Full migration with constraint handling
- `migration_safe_update.sql` - Full migration with backup and rollback
- `migration_update_columns.sql` - Standard migration script
- `quick_migration.sql` - Minimal migration (fastest)
- `fixed_migration.sql` - PostgreSQL syntax corrected version
- `supabase_migration.sql` - Supabase-optimized version

## Safety Features

The `migration_safe_update.sql` includes:
- Transaction wrapping for atomicity
- Backup tables creation
- Rollback capability
- Data verification steps

## After Migration

Once the migration is complete:

1. **Test the application** - The frontend code is already updated to handle ranges
2. **Create a test template** with ranges like:
   - Reps: "8-12"
   - Rest: "60-90"
   - Load: "80" (specific values still work)
3. **Start a session** - Ranges will be converted to specific values automatically

## Example Usage

**Before Migration:**
- Template: 10 reps, 60 sec rest
- Session: Always 10 reps, 60 sec rest

**After Migration:**
- Template: "8-12 reps", "45-90 sec rest"
- Session: Random values like 10 reps, 75 sec rest, 9 reps, 82 sec rest, etc.

## Troubleshooting

### Common Errors

**"operator does not exist: character varying >= integer"**
This error occurs when there are CHECK constraints that compare varchar columns with integer values.

**Solution:**
1. Run `check_constraints.sql` to see what constraints exist
2. Run `drop_constraints.sql` to remove conflicting constraints
3. Then run `fixed_migration.sql` to complete the migration

**"syntax error at or near 'DEFAULT'"**
This is a PostgreSQL syntax issue with combining TYPE and DEFAULT in one statement.

**Solution:**
Use `complete_migration.sql` or `fixed_migration.sql` which have correct syntax.

### General Troubleshooting Steps

1. Run `check_migration_status.sql` to see current state
2. Run `check_constraints.sql` to check for conflicting constraints
3. If constraints exist, use `complete_migration.sql` (recommended)
4. Or manually run `drop_constraints.sql` then `fixed_migration.sql`
5. Ensure you have the necessary permissions to alter tables

## Rollback (if needed)

If you used the safe migration and need to rollback:
```sql
ROLLBACK;
DROP TABLE IF EXISTS template_exercises_backup;
DROP TABLE IF EXISTS performed_sets_backup;
```
