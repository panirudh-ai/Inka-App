import fs from "fs";
import path from "path";
import { Router } from "express";
import multer from "multer";
import xlsx from "xlsx";
import { pool } from "../db/pool.js";
import { requireRoles } from "../middleware/auth.js";
import { uploadProjectFileToDrive } from "../services/googleDrive.js";
import { logActivity } from "../services/activity.js";
import { asyncHandler } from "../services/asyncHandler.js";

const router = Router();

const uploadDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeOriginal = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    cb(null, `${Date.now()}_${safeOriginal}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
});

const driveUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

async function assertUploadProjectAccess(ctx, projectId) {
  const params = [projectId, ctx.tenantId];
  let where = "p.id = $1 AND p.tenant_id = $2";
  if (ctx.role === "engineer") {
    params.push(ctx.userId);
    where += ` AND EXISTS (
      SELECT 1 FROM project_engineers pe
      WHERE pe.project_id = p.id AND pe.user_id = $${params.length}
    )`;
  }
  const { rowCount } = await pool.query(`SELECT 1 FROM projects p WHERE ${where}`, params);
  if (!rowCount) {
    const err = new Error("Project not found or access denied");
    err.status = 404;
    throw err;
  }
}

async function getProjectForUpload(ctx, projectId) {
  const { rows } = await pool.query(
    `SELECT id, name, client_name, drive_link
     FROM projects
     WHERE id = $1 AND tenant_id = $2`,
    [projectId, ctx.tenantId]
  );
  if (!rows.length) {
    const err = new Error("Project not found");
    err.status = 404;
    throw err;
  }
  return rows[0];
}

router.post(
  "/photo",
  requireRoles("admin", "project_manager", "engineer"),
  upload.single("photo"),
  (req, res) => {
    if (!req.file) return res.status(400).json({ error: "Photo file is required" });
    const host = `${req.protocol}://${req.get("host")}`;
    const photoUrl = `${host}/uploads/${req.file.filename}`;
    return res.status(201).json({ photoUrl });
  }
);

router.post(
  "/drive",
  requireRoles("admin", "project_manager", "engineer"),
  driveUpload.single("file"),
  async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ error: "File is required" });
      const projectId = req.body?.projectId;
      if (!projectId) return res.status(400).json({ error: "projectId is required" });
      await assertUploadProjectAccess(req.ctx, projectId);
      const project = await getProjectForUpload(req.ctx, projectId);

      const uploaded = await uploadProjectFileToDrive({
        fileBuffer: req.file.buffer,
        mimeType: req.file.mimetype,
        fileName: req.file.originalname,
        projectId,
        uploadedBy: req.ctx.userId,
        clientName: project.client_name,
        projectName: project.name,
      });

      if (!project.drive_link && uploaded.projectFolderLink) {
        await pool.query(
          `UPDATE projects
           SET drive_link = $1, row_version = row_version + 1
           WHERE id = $2 AND tenant_id = $3`,
          [uploaded.projectFolderLink, projectId, req.ctx.tenantId]
        );
      }

      await logActivity(pool, {
        tenantId: req.ctx.tenantId,
        projectId,
        userId: req.ctx.userId,
        actionType: "DRIVE_FILE_UPLOADED",
        entityType: "project_drive_file",
        entityId: null,
        metadata: {
          fileId: uploaded.id,
          name: uploaded.name,
          webViewLink: uploaded.webViewLink || uploaded.webContentLink || null,
          projectFolderLink: uploaded.projectFolderLink || null,
        },
      });

      return res.status(201).json({
        fileId: uploaded.id,
        name: uploaded.name,
        webViewLink: uploaded.webViewLink || uploaded.webContentLink || null,
        projectFolderLink: uploaded.projectFolderLink || null,
        mimeType: uploaded.mimeType,
        createdTime: uploaded.createdTime,
      });
    } catch (error) {
      return next(error);
    }
  }
);

// Excel Import Endpoint
const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
    }
  }
});

function normalizeText(value) {
  if (value == null) return '';
  return String(value).replace(/\r|\n/g, ' ').trim();
}

function normalizeKey(value) {
  return normalizeText(value).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function parseNumber(value) {
  const v = normalizeText(value);
  if (!v) return 0;
  const clean = v.replace(/[^0-9.\-]/g, '');
  if (!clean) return 0;
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
}

function sanitizeEntityName(value, fallback = 'Unknown') {
  let v = normalizeText(value).replace(/[\u0000-\u001F]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!v || v.length < 2) v = fallback;
  if (v.length > 140) v = v.substring(0, 140).trim();
  if (v.length < 2) v = fallback;
  return v;
}

function isMeaningfulValue(value) {
  const v = normalizeText(value).toLowerCase();
  if (!v) return false;
  if (['system.xml.xmlelement', 'count', '%', 'overall site status', 'material status'].includes(v)) return false;
  if (/^(visit no|sr no|ir no|date|client name|site|location|phone number)$/.test(v)) return false;
  if (v.length < 2) return false;
  if (!/[a-z]/.test(v)) return false;
  return true;
}

function mapSiteStatus(raw) {
  const v = normalizeText(raw).toLowerCase();
  if (/yet to start/.test(v)) return 'Work Yet to Start';
  if (/position marked/.test(v)) return 'Position Marked';
  if (/piping done/.test(v)) return 'Piping Done';
  if (/wiring done/.test(v)) return 'Wiring Done';
  if (/checked ok/.test(v)) return 'Wiring Checked OK';
  if (/rework/.test(v)) return 'Wiring Rework Required';
  if (/provision not provided/.test(v)) return 'Provision Not Provided';
  if (/position to be changed/.test(v)) return 'Position To Be Changed';
  if (/installed.*working/.test(v)) return 'Installed - Working';
  if (/installed.*activate/.test(v)) return 'Installed - To Activate';
  if (/installed.*not working/.test(v)) return 'Installed - Not Working';
  return 'Work Yet to Start';
}

async function ensureCategory(ctx, name, sequenceOrder = 999) {
  const { rows } = await pool.query(
    `SELECT id, name, sequence_order, is_active FROM categories WHERE tenant_id = $1 AND name = $2 LIMIT 1`,
    [ctx.tenantId, name]
  );
  if (rows.length) return rows[0];
  
  const result = await pool.query(
    `INSERT INTO categories (tenant_id, name, sequence_order, is_active) VALUES ($1, $2, $3, $4) RETURNING id, name, sequence_order, is_active`,
    [ctx.tenantId, name, sequenceOrder, true]
  );
  return result.rows[0];
}

async function ensureBrand(ctx, name) {
  const n = sanitizeEntityName(name, 'Unknown Brand');
  const { rows } = await pool.query(
    `SELECT id, name, is_active FROM brands WHERE tenant_id = $1 AND LOWER(name) = LOWER($2) LIMIT 1`,
    [ctx.tenantId, n]
  );
  if (rows.length) return rows[0];
  
  const result = await pool.query(
    `INSERT INTO brands (tenant_id, name, is_active) VALUES ($1, $2, $3) RETURNING id, name, is_active`,
    [ctx.tenantId, n, true]
  );
  return result.rows[0];
}

async function ensureProductType(ctx, categoryId, name) {
  const n = sanitizeEntityName(name, 'Unknown Product');
  const { rows } = await pool.query(
    `SELECT id, category_id, name, is_active FROM product_types WHERE tenant_id = $1 AND category_id = $2 AND LOWER(name) = LOWER($3) LIMIT 1`,
    [ctx.tenantId, categoryId, n]
  );
  if (rows.length) return rows[0];
  
  const result = await pool.query(
    `INSERT INTO product_types (tenant_id, category_id, name, is_active) VALUES ($1, $2, $3, $4) RETURNING id, category_id, name, is_active`,
    [ctx.tenantId, categoryId, n, true]
  );
  return result.rows[0];
}

async function ensureItem(ctx, categoryId, productTypeId, brandId, modelNumber, fullName, rate) {
  const model = sanitizeEntityName(modelNumber, 'UNKNOWN-MODEL');
  const fn = sanitizeEntityName(fullName, model);
  
  const { rows } = await pool.query(
    `SELECT id FROM items WHERE tenant_id = $1 AND product_type_id = $2 AND brand_id = $3 AND LOWER(model_number) = LOWER($4) LIMIT 1`,
    [ctx.tenantId, productTypeId, brandId, model]
  );
  if (rows.length) return rows[0];
  
  const result = await pool.query(
    `INSERT INTO items (tenant_id, category_id, product_type_id, brand_id, model_number, full_name, unit_of_measure, default_rate, specifications, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
    [ctx.tenantId, categoryId, productTypeId, brandId, model, fn, 'Nos', rate, '{}', true]
  );
  return result.rows[0];
}

async function ensureClient(ctx, name, location = '') {
  const n = sanitizeEntityName(name, 'Unknown Client');
  const loc = normalizeText(location);
  
  const { rows } = await pool.query(
    `SELECT id, name, location, is_active FROM clients WHERE tenant_id = $1 AND LOWER(name) = LOWER($2) LIMIT 1`,
    [ctx.tenantId, n]
  );
  if (rows.length) return rows[0];
  
  const result = await pool.query(
    `INSERT INTO clients (tenant_id, name, location, is_active) VALUES ($1, $2, $3, $4) RETURNING id, name, location, is_active`,
    [ctx.tenantId, n, loc, true]
  );
  return result.rows[0];
}

async function ensureProject(ctx, name, clientId, clientName, location) {
  const n = sanitizeEntityName(name, 'Unnamed Project');
  const loc = normalizeText(location) || 'Unknown';
  const cn = sanitizeEntityName(clientName, n);
  
  const { rows } = await pool.query(
    `SELECT id FROM projects WHERE tenant_id = $1 AND LOWER(name) = LOWER($2) LIMIT 1`,
    [ctx.tenantId, n]
  );
  if (rows.length) return rows[0];
  
  const result = await pool.query(
    `INSERT INTO projects (tenant_id, name, client_id, client_name, location, status, start_date, category_sequence_mode, created_by) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE, $7, $8) RETURNING id`,
    [ctx.tenantId, n, clientId, cn, loc, 'active', false, ctx.userId]
  );
  return result.rows[0];
}

async function createChangeRequest(ctx, projectId) {
  const result = await pool.query(
    `INSERT INTO change_requests (tenant_id, project_id, requested_by, status, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id`,
    [ctx.tenantId, projectId, ctx.userId, 'approved']
  );
  return result.rows[0];
}

async function addChangeRequestItem(ctx, crId, itemId, changeType, newQty, oldQty) {
  await pool.query(
    `INSERT INTO change_request_items (change_request_id, item_id, change_type, new_quantity, old_quantity) VALUES ($1, $2, $3, $4, $5)`,
    [crId, itemId, changeType, newQty, oldQty]
  );
}

async function ensureBomItem(ctx, projectId, itemId, quantity, rate, status) {
  const { rows } = await pool.query(
    `SELECT id FROM project_bom_items WHERE project_id = $1 AND item_id = $2 LIMIT 1`,
    [projectId, itemId]
  );
  if (rows.length) {
    await pool.query(
      `UPDATE project_bom_items SET quantity = $1, rate = $2, status = $3, updated_by = $4, updated_at = NOW() WHERE id = $5`,
      [quantity, rate, status, ctx.userId, rows[0].id]
    );
    return rows[0];
  }
  
  const result = await pool.query(
    `INSERT INTO project_bom_items (tenant_id, project_id, item_id, quantity, rate, delivered_quantity, status, updated_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [ctx.tenantId, projectId, itemId, quantity, rate, 0, status, ctx.userId]
  );
  return result.rows[0];
}

router.post(
  "/excel-import",
  requireRoles("admin", "project_manager"),
  excelUpload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "Excel file is required" });
    }

    const summary = {
      projectsImported: 0,
      clientsCreated: 0,
      categoriesCreated: 0,
      brandsCreated: 0,
      productTypesCreated: 0,
      itemsCreated: 0,
      bomItemsCreated: 0,
      errors: []
    };

    try {
      // Parse Excel
      const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
      const sheets = {};
      workbook.SheetNames.forEach(name => {
        sheets[name] = xlsx.utils.sheet_to_json(workbook.Sheets[name], { header: 1 });
      });

      // Check required sheets
      if (!sheets['ClientProjects List']) {
        return res.status(400).json({ error: "ClientProjects List sheet not found" });
      }

      // Get or create default category
      const defaultCategory = await ensureCategory(req.ctx, 'Legacy Imported', 999);
      
      // Process Client-Mas-Names if exists
      const clientBillingMap = {};
      if (sheets['Client-Mas-Names']) {
        const clientMasRows = sheets['Client-Mas-Names'];
        for (let i = 1; i < clientMasRows.length; i++) {
          const row = clientMasRows[i];
          if (!row || row.length < 2) continue;
          const client = normalizeText(row[0]);
          const billing = normalizeText(row[1]);
          if (client) {
            clientBillingMap[client.toLowerCase()] = billing || client;
          }
        }
      }

      // Process ClientProjects List
      const projectListRows = sheets['ClientProjects List'];
      const projectsToImport = [];
      let headerRowIdx = 0;
      let colMap = { sheet: 0, client: 2, location: 3, drive: 4 };

      // Find header row
      for (let i = 0; i < Math.min(8, projectListRows.length); i++) {
        const row = projectListRows[i];
        if (!row) continue;
        for (let j = 0; j < row.length; j++) {
          const val = normalizeText(row[j]).toLowerCase();
          if (/^sheet\s*no\.?$/.test(val) || /^s\.?no\.?$/.test(val)) colMap.sheetNo = j;
          if (/project name|sheet name|^project$/.test(val)) colMap.sheet = j;
          if (/client/.test(val)) colMap.client = j;
          if (/location|site/.test(val)) colMap.location = j;
          if (/drive|gdrive|google/.test(val)) colMap.drive = j;
        }
        if (row.some(cell => /project|sheet/.test(normalizeText(cell).toLowerCase()))) {
          headerRowIdx = i;
          break;
        }
      }

      // Collect projects to import
      const masterSheets = workbook.SheetNames.slice(0, 3);
      const masterSheetSet = new Set(masterSheets.map(s => normalizeKey(s)));

      for (let i = headerRowIdx + 1; i < projectListRows.length; i++) {
        const row = projectListRows[i];
        if (!row) continue;
        
        const sheetName = normalizeText(row[colMap.sheet]);
        if (!sheetName) continue;
        if (masterSheetSet.has(normalizeKey(sheetName))) continue;
        
        let clientName = normalizeText(row[colMap.client]);
        if (clientBillingMap[clientName?.toLowerCase()]) {
          clientName = clientBillingMap[clientName.toLowerCase()];
        }
        
        projectsToImport.push({
          sheetName,
          clientName: clientName || sheetName,
          location: normalizeText(row[colMap.location]) || 'Unknown',
          driveLink: normalizeText(row[colMap.drive]) || ''
        });
      }

      // Import each project
      for (const proj of projectsToImport) {
        try {
          if (!sheets[proj.sheetName]) {
            summary.errors.push(`Sheet not found: ${proj.sheetName}`);
            continue;
          }

          const sheetRows = sheets[proj.sheetName];
          
          // Find header row with Brand/Product/Model columns
          let bomHeaderIdx = -1;
          let bomCols = { brand: -1, product: -1, model: -1, salePrice: -1, siteStatus: -1 };
          
          for (let i = 0; i < Math.min(20, sheetRows.length); i++) {
            const row = sheetRows[i];
            if (!row) continue;
            
            for (let j = 0; j < row.length; j++) {
              const val = normalizeText(row[j]).toLowerCase();
              if (val === 'brand') bomCols.brand = j;
              if (val === 'product') bomCols.product = j;
              if (/model no|model/.test(val)) bomCols.model = j;
              if (/sale price/.test(val)) bomCols.salePrice = j;
              if (/site status/.test(val)) bomCols.siteStatus = j;
            }
            
            if (bomCols.brand >= 0 && bomCols.product >= 0 && bomCols.model >= 0) {
              bomHeaderIdx = i;
              break;
            }
          }

          if (bomHeaderIdx < 0) {
            summary.errors.push(`No Brand/Product/Model header found in ${proj.sheetName}`);
            continue;
          }

          // Aggregate BOM items
          const bomAgg = {};
          for (let i = bomHeaderIdx + 1; i < sheetRows.length; i++) {
            const row = sheetRows[i];
            if (!row) continue;
            
            const brand = normalizeText(row[bomCols.brand]);
            const product = normalizeText(row[bomCols.product]);
            const model = normalizeText(row[bomCols.model]);
            
            if (!brand && !product && !model) continue;
            if (!isMeaningfulValue(product)) continue;
            
            const brandName = isMeaningfulValue(brand) ? brand : 'Unknown Brand';
            const productName = isMeaningfulValue(product) ? product : 'Unknown Product';
            const modelNum = isMeaningfulValue(model) ? model : 'UNKNOWN-MODEL';
            
            const rate = bomCols.salePrice >= 0 ? parseNumber(row[bomCols.salePrice]) : 0;
            const siteStatus = bomCols.siteStatus >= 0 ? mapSiteStatus(row[bomCols.siteStatus]) : 'Work Yet to Start';
            
            const key = `${brandName.toLowerCase()}|${productName.toLowerCase()}|${modelNum.toLowerCase()}`;
            if (!bomAgg[key]) {
              bomAgg[key] = {
                brand: brandName,
                product: productName,
                model: modelNum,
                qty: 0,
                rate,
                status: siteStatus
              };
            }
            bomAgg[key].qty += 1;
            if (rate > 0) bomAgg[key].rate = rate;
          }

          if (Object.keys(bomAgg).length === 0) {
            summary.errors.push(`No BOM items found in ${proj.sheetName}`);
            continue;
          }

          // Create/update client
          const client = await ensureClient(req.ctx, proj.clientName, proj.location);
          if (client.created) summary.clientsCreated++;

          // Create/update project
          const project = await ensureProject(req.ctx, proj.sheetName, client.id, client.name, proj.location);
          summary.projectsImported++;

          // Process BOM items
          for (const entry of Object.values(bomAgg)) {
            const brand = await ensureBrand(req.ctx, entry.brand);
            if (brand.created) summary.brandsCreated++;

            const productType = await ensureProductType(req.ctx, defaultCategory.id, entry.product);
            if (productType.created) summary.productTypesCreated++;

            const fullName = `${brand.name} ${productType.name} ${entry.model}`.trim();
            const item = await ensureItem(req.ctx, defaultCategory.id, productType.id, brand.id, entry.model, fullName, entry.rate);
            if (item.created) summary.itemsCreated++;

            await ensureBomItem(req.ctx, project.id, item.id, entry.qty, entry.rate, entry.status);
            summary.bomItemsCreated++;
          }

        } catch (err) {
          summary.errors.push(`${proj.sheetName}: ${err.message}`);
        }
      }

      // Log activity
      await logActivity(pool, {
        tenantId: req.ctx.tenantId,
        projectId: null,
        userId: req.ctx.userId,
        actionType: 'EXCEL_IMPORTED',
        entityType: 'excel_import',
        entityId: null,
        metadata: {
          fileName: req.file.originalname,
          projectsImported: summary.projectsImported,
          itemsCreated: summary.itemsCreated
        }
      });

      res.json(summary);

    } catch (error) {
      console.error('Excel import error:', error);
      res.status(500).json({ error: error.message || 'Excel import failed' });
    }
  })
);

export default router;
