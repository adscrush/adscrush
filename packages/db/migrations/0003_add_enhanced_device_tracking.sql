-- Migration: Add enhanced device tracking fields
-- Created: 2026-07-21

-- Add new device tracking columns
ALTER TABLE clicks ADD COLUMN IF NOT EXISTS device_vendor TEXT;
ALTER TABLE clicks ADD COLUMN IF NOT EXISTS device_model TEXT;
ALTER TABLE clicks ADD COLUMN IF NOT EXISTS os_version TEXT;
ALTER TABLE clicks ADD COLUMN IF NOT EXISTS browser_version TEXT;

-- Add index for device vendor for analytics queries
CREATE INDEX IF NOT EXISTS clicks_device_vendor_idx ON clicks (device_vendor);

-- Update comments for documentation
COMMENT ON COLUMN clicks.device_type IS 'Device category: desktop, mobile, tablet, tv, wearable, console, embedded';
COMMENT ON COLUMN clicks.device_vendor IS 'Device manufacturer: Apple, Samsung, Google, Huawei, etc.';
COMMENT ON COLUMN clicks.device_model IS 'Specific device model: iPhone 13, Galaxy S21, iPad Pro, etc.';
COMMENT ON COLUMN clicks.os_version IS 'Operating system version: 15.0, 11, 10.15.7, etc.';
COMMENT ON COLUMN clicks.browser_version IS 'Browser version: 96.0.4664.110, 15.1, etc.';
