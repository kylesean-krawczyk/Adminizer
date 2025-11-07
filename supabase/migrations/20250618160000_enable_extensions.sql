/*
  # Enable Required PostgreSQL Extensions

  1. Extensions
    - `pgcrypto` - Provides cryptographic functions including gen_random_uuid() and gen_random_bytes()
    - `uuid-ossp` - Provides UUID generation functions

  2. Purpose
    - This migration must run FIRST before any tables are created
    - Ensures all UUID and cryptographic functions are available for subsequent migrations
*/

-- Enable pgcrypto extension for gen_random_uuid() and gen_random_bytes()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enable uuid-ossp extension for additional UUID functions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
