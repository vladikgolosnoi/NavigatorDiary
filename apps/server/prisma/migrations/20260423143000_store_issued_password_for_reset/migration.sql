ALTER TABLE "PasswordResetRequest"
ADD COLUMN IF NOT EXISTS "issuedPassword" TEXT;
