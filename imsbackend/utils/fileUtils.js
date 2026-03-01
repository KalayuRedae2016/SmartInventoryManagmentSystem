const fs = require('fs');
const fss = require('fs').promises;  // Use fs.promises for async file reading
const path = require('path');
const xlsx = require('xlsx'); //for import user from excel
const fsp = require('fs').promises;

const { sequelize } = require('../models'); // adjust path
const multer = require('multer');
const catchAsync = require('./catchAsync');
const AppError = require('./appError');
const {buildFilter}=require("../utils/buildFilter")


exports.createMulterMiddleware = (destinationFolder,filenamePrefix,allowedTypes = [],maxFileSizeMB = 5) => {
  if (!fs.existsSync(destinationFolder)) {
    fs.mkdirSync(destinationFolder, { recursive: true });
  }

  const storage = multer.diskStorage({destination: (req, file, cb) => {
      cb(null, destinationFolder);
    },

    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const name = path
        .basename(file.originalname, ext)
        .replace(/\s+/g, '-')
        .toLowerCase();

      const uniqueName = `${filenamePrefix}-${name}-${Date.now()}${ext}`;
      cb(null, uniqueName);
    }
  });

  const fileFilter = (req, file, cb) => {
    if (!allowedTypes.length || allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new AppError(
          `Unsupported file type: ${file.mimetype}`,
          400
        ),
        false
      );
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: maxFileSizeMB * 1024 * 1024
    }
  });
};

exports.extractFiles = (req, folder = '') => {
  const files = req.files || {};

  const getSingle = (field) =>files[field]?.[0]? `/uploads/${folder}/${files[field][0].filename}`: null;

  const getMultiple = (field) =>(files[field] || []).map(file => ({
      fileName: file.filename,
      fileType: file.mimetype,
      path: `/uploads/${folder}/${file.filename}`
    }));

  return {
    single: getSingle,
    multiple: getMultiple
  };
};

exports.processUploadFilesToSave = async (req,files = {},body = {},existingModel = null,folder = '') => {
  const baseUrl = `${req.protocol}://${req.get('host')}/uploads/${folder}/`;

  /* ---------- PROFILE IMAGE (SINGLE) ---------- */
  let profileImage = existingModel?.profileImage || null;

  if (files.profileImage?.length) {
    profileImage = `${baseUrl}${files.profileImage[0].filename}`;
  }

  /* ---------- IMAGES (MULTIPLE) ---------- */
  const newImages = (files.images || []).map(file => ({
    fileName: file.filename,
    fileType: file.mimetype,
    url: `${baseUrl}${file.filename}`,
    uploadedAt: new Date()
  }));

  const images = existingModel
    ? [...(existingModel.images || []), ...newImages]
    : newImages;

  /* ---------- DOCUMENTS (MULTIPLE) ---------- */
  const newDocuments = (files.documents || []).map(file => ({
    fileName: file.filename,
    fileType: file.mimetype,
    url: `${baseUrl}${file.filename}`,
    uploadedAt: new Date()
  }));

  const documents = existingModel
    ? [...(existingModel.documents || []), ...newDocuments]
    : newDocuments;

  /* ---------- DEFAULT PROFILE IMAGE ---------- */
  if (!profileImage) {
    profileImage = `${req.protocol}://${req.get('host')}/uploads/default.png`;
  }

  return {
    profileImage,
    images,
    documents
  };
};

exports.deleteFile = async (fileUrl) => {
  if (!fileUrl) return;

  try {
    const relativePath = fileUrl.split('/uploads/')[1];
    if (!relativePath) return;

    const absolutePath = path.join(
      __dirname,
      '..',
      'uploads',
      relativePath
    );

    await fsp.access(absolutePath);
    await fsp.unlink(absolutePath);
  } catch (err) {
    console.warn('File delete skipped:', err.message);
  }
};
exports.deleteMultipleFiles = async (fileArray = []) => {
  if (!Array.isArray(fileArray)) return;

  for (const file of fileArray) {
    if (file?.url) {
      await exports.deleteFile(file.url);
    }
  }
};

exports.mapImportRows = (rows, mapFn) => {
  return rows.map((row, index) => {
    try {
      return mapFn(row);
    } catch (error) {
      throw new Error(`Error processing row ${index + 1}: ${error.message}`);
    } 
  });
}

//exports.importFromExcel = catchAsync(async (req,Model, transformFn) => {
//     console.log("hereexcel")
//     console.log("request File",req.file)
//   if (!req.file || !req.file.path) {
//     return next(new AppError('File not uploaded or path is invalid.', 400));
//   }

//   if (!req.file.mimetype.includes('spreadsheetml') && !req.file.originalname.endsWith('.xlsx')) {
//     return next(new AppError('Please upload a valid Excel file (.xlsx)', 400));
//   }

//   const filePath = req.file.path;
//   const workbook = xlsx.readFile(filePath);
//   const worksheet = workbook.Sheets[workbook.SheetNames[0]];
//   const jsonData = xlsx.utils.sheet_to_json(worksheet);
  
//   console.log(jsonData)

//   if (!Array.isArray(jsonData) || jsonData.length === 0) {
//     throw new AppError("Excel file is empty or data is not in the correct format.", 400);
//   }

//   const importedData = [];
//   const errors = [];
//   for (const [index, data] of jsonData.entries()) {
//     try {
//       const document = transformFn ? await transformFn(data) : new Model(data);
//       console.log("Transformed Data:", document); // Log transformed user data
//       const savedDocument = await document.save();
//       importedData.push(savedDocument);
//     } catch (error) {
//       errors.push({ row: index + 1, error: error.message, data });
//       continue; // Ensure processing continues for subsequent rows
//     }
//   }
//   console.log("Returning from importFromExcel:", { importedData, errors });
// return { importedData, errors };
// });

exports.importFromExcel = (Model, options = {}) => {
  const {transformFn = null,injectFields = [],uniqueCheckFields = []} = options;

  return async (req, res, next) => {
    if (!req.file || !req.file.path) {
      return next(new AppError("Excel file not uploaded", 400));
    }

    const transaction = await sequelize.transaction();

    try {

      const workbook = xlsx.readFile(req.file.path);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = xlsx.utils.sheet_to_json(worksheet);

      if (!rows.length) {
        throw new AppError("Excel file is empty", 400);
      }

      const imported = [];
      const errors = [];

      for (const [index, row] of rows.entries()) {

        try {

          let data = row;

          // Optional transform per module
          if (transformFn) {
            data = await transformFn(row, req);
          }

          // Inject system fields (like businessId)
          injectFields.forEach(field => {
            if (req.user && req.user[field]) {
              data[field] = req.user[field];
            }
          });

          // Optional duplicate check
          if (uniqueCheckFields.length) {
            const where = {};
            uniqueCheckFields.forEach(field => {
              where[field] = data[field];
            });

            const exists = await Model.findOne({ where });
            if (exists) {
              throw new Error("Duplicate entry detected");
            }
          }

          const created = await Model.create(data, { transaction });
          imported.push(created);

        } catch (err) {
          errors.push({
            row: index + 2, // +2 because Excel header
            message: err.message
          });
        }
      }

      await transaction.commit();

      fs.unlinkSync(req.file.path);

      return res.status(200).json({
        status: 1,
        message: "Import completed",
        importedCount: imported.length,
        errorCount: errors.length,
        errors
      });

    } catch (err) {

      await transaction.rollback();
      fs.unlinkSync(req.file.path);

      return next(err);
    }
  };
};

exports.readExcelFile = catchAsync(async (filePath) => {
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = xlsx.utils.sheet_to_json(worksheet);
    return jsonData;
});

exports.exportToExcel = (Model, include = [], allowedFilters = []) => {
  return async (req, res, next) => {
    try {

      // Build dynamic filters
      const where = buildFilter(req.query, allowedFilters);

      const data = await Model.findAll({
        where,
        include
      });

      // Convert Sequelize objects to plain JSON
      const formatted = data.map(item => item.toJSON());

      const worksheet = xlsx.utils.json_to_sheet(formatted);
      const workbook = xlsx.utils.book_new();

      xlsx.utils.book_append_sheet(workbook, worksheet, "Report");

      // Generate buffer instead of writing to disk
      const buffer = xlsx.write(workbook, {
        type: "buffer",
        bookType: "xlsx"
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      res.setHeader(
        "Content-Disposition",
        `attachment; filename=report-${Date.now()}.xlsx`
      );

      return res.send(buffer);

    } catch (err) {
      return next(err);
    }
  };
};
