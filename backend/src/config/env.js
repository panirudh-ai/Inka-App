import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  databaseUrl:
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/inka_db_v1",
  jwtSecret: process.env.JWT_SECRET || "inka_enterprise_super_secret_change_me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "12h",
  googleDriveEnabled: (process.env.GOOGLE_DRIVE_ENABLED || "false").toLowerCase() === "true",
  googleDriveServiceAccountEmail: process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL || "",
  googleDrivePrivateKey: (process.env.GOOGLE_DRIVE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  googleDriveFolderId: process.env.GOOGLE_DRIVE_FOLDER_ID || "",
  googleDrivePublicLinks: (process.env.GOOGLE_DRIVE_PUBLIC_LINKS || "false").toLowerCase() === "true",
};
