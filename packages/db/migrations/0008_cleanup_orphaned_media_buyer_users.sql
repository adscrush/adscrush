-- Cleanup: delete orphaned media_buyer user accounts whose media_buyers row was
-- previously deleted (before the fix that cascade-deletes the user).
-- Sessions and accounts are automatically removed via ON DELETE CASCADE.

DELETE FROM "user"
WHERE "role" = 'media_buyer'
  AND "id" NOT IN (SELECT "userId" FROM "media_buyers");
