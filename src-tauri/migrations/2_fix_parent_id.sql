-- Fix parent_id = 0 values, convert them to NULL for root locations
UPDATE locations SET parent_id = NULL WHERE parent_id = 0;
