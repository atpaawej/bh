-- Add username column to User model
ALTER TABLE "User" ADD COLUMN "username" TEXT;

-- Create unique index on username
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
