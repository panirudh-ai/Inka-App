import { Readable } from "stream";
import { google } from "googleapis";
import { env } from "../config/env.js";

function assertDriveConfigured() {
  if (!env.googleDriveEnabled) {
    const err = new Error("Google Drive integration is disabled");
    err.status = 503;
    throw err;
  }
  if (!env.googleDriveServiceAccountEmail || !env.googleDrivePrivateKey || !env.googleDriveFolderId) {
    const err = new Error("Google Drive credentials/folder not configured");
    err.status = 503;
    throw err;
  }
}

async function getDrive() {
  assertDriveConfigured();
  const auth = new google.auth.JWT({
    email: env.googleDriveServiceAccountEmail,
    key: env.googleDrivePrivateKey,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
  await auth.authorize();
  return google.drive({ version: "v3", auth });
}

function sanitizeFolderName(value, fallback = "Unknown") {
  const raw = String(value || "").replace(/[\\/:*?"<>|]/g, " ").replace(/\s+/g, " ").trim();
  return raw || fallback;
}

async function findFolderByName(drive, parentId, name) {
  const escapedName = String(name).replace(/'/g, "\\'");
  const escapedParent = String(parentId).replace(/'/g, "\\'");
  const q = `'${escapedParent}' in parents and trashed=false and mimeType='application/vnd.google-apps.folder' and name='${escapedName}'`;
  const res = await drive.files.list({
    q,
    pageSize: 1,
    fields: "files(id,name,webViewLink)",
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  return res.data.files?.[0] || null;
}

async function getOrCreateFolder(drive, parentId, name) {
  const existing = await findFolderByName(drive, parentId, name);
  if (existing) return existing;
  const created = await drive.files.create({
    requestBody: {
      name,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parentId],
    },
    fields: "id,name,webViewLink",
    supportsAllDrives: true,
  });
  return created.data;
}

async function ensureProjectFolderHierarchy(drive, { clientName, projectName }) {
  const inkaFolder = await getOrCreateFolder(drive, env.googleDriveFolderId, "INKA");
  const clientFolder = await getOrCreateFolder(
    drive,
    inkaFolder.id,
    sanitizeFolderName(clientName, "Unknown Client")
  );
  const projectFolder = await getOrCreateFolder(
    drive,
    clientFolder.id,
    sanitizeFolderName(projectName, "Unknown Project")
  );
  return {
    inkaFolder,
    clientFolder,
    projectFolder,
  };
}

export async function uploadProjectFileToDrive({
  fileBuffer,
  mimeType,
  fileName,
  projectId,
  uploadedBy,
  clientName,
  projectName,
}) {
  const drive = await getDrive();
  const safeName = `${Date.now()}_${String(fileName || "upload").replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
  const hierarchy = await ensureProjectFolderHierarchy(drive, { clientName, projectName });

  const created = await drive.files.create({
    requestBody: {
      name: safeName,
      parents: [hierarchy.projectFolder.id],
      appProperties: {
        projectId: String(projectId),
        uploadedBy: String(uploadedBy || ""),
      },
    },
    media: {
      mimeType: mimeType || "application/octet-stream",
      body: Readable.from(fileBuffer),
    },
    fields: "id,name,webViewLink,webContentLink,mimeType,createdTime",
    supportsAllDrives: true,
  });

  if (env.googleDrivePublicLinks && created.data?.id) {
    await drive.permissions.create({
      fileId: created.data.id,
      requestBody: { role: "reader", type: "anyone" },
      supportsAllDrives: true,
    });
  }

  return {
    ...created.data,
    projectFolderId: hierarchy.projectFolder.id,
    projectFolderLink: hierarchy.projectFolder.webViewLink || null,
  };
}

export async function listProjectFilesFromDrive(projectId) {
  const drive = await getDrive();
  const escapedProjectId = String(projectId).replace(/'/g, "\\'");
  const q = `trashed=false and appProperties has { key='projectId' and value='${escapedProjectId}' } and mimeType!='application/vnd.google-apps.folder'`;

  const resp = await drive.files.list({
    q,
    fields: "files(id,name,mimeType,webViewLink,webContentLink,createdTime)",
    orderBy: "createdTime desc",
    pageSize: 100,
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
  });
  return resp.data.files || [];
}
