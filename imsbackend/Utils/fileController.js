const fs = require('fs');
const fss = require('fs').promises;  // Use fs.promises for async file reading
const path = require('path');
//const xlsx = require('xlsx'); //for import user from excel

const multer = require('multer');
const catchAsync = require('./catchAsync');
const AppError = require('./appError');


exports.createMulterMiddleware = (destinationFolder, filenamePrefix, allowedTypes = []) => {
  if (!fs.existsSync(destinationFolder)) fs.mkdirSync(destinationFolder, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, destinationFolder),
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const { name, ext } = path.parse(file.originalname);
      const uniqueFilename = `${filenamePrefix}-${name}-${timestamp}${path.extname(file.originalname)}`;
      cb(null, uniqueFilename);
    },
  });

  const fileFilter = (req, file, cb) => {
    if (!allowedTypes.length || allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Unsupported file type"), false);
  };

  return multer({ storage, fileFilter });
};

exports.deleteFile = async (filePath) => {
  if (!filePath) return;
  const absolutePath = path.join(__dirname, "..", filePath);
  try {
    await fs.promises.access(absolutePath);
    await fs.promises.unlink(absolutePath);
    console.log("Deleted:", absolutePath);
  } catch (err) {
    console.warn("File not found or error deleting:", absolutePath, err.message);
  }
};

exports.processUploadFilesToSave = async (req, files = {}, body = {}, existingModel = null, folder = "") => {
  const baseUrl = `${req.protocol}://${req.get("host")}/uploads/${folder}`;

  // Process profileImage if exists
  let profileImage = files.profileImage?.[0] ? `${baseUrl}${files.profileImage[0].filename}` : existingModel?.profileImage || null;

  // Process images array
  const newImages = (files.images || []).map(file => ({
    fileName: file.filename,
    fileType: file.mimetype,
    url: `${baseUrl}${file.filename}`,
    uploadDate: new Date().toISOString()
  }));

  const images = existingModel ? [...(existingModel.images || []), ...newImages] : newImages;

  // Process documents array
  const newDocuments = (files.documents || []).map(file => ({
    fileName: file.filename,
    fileType: file.mimetype,
    url: `${baseUrl}${file.filename}`,
    uploadDate: new Date().toISOString()
  }));

  const documents = existingModel ? [...(existingModel.documents || []), ...newDocuments] : newDocuments;

  // Fallback profile image
  if (!profileImage) profileImage = `${req.protocol}://${req.get("host")}/uploads/default.png`;

  return { profileImage, images, documents };
};


exports.importFromExcel = catchAsync(async (req,Model, transformFn) => {
    console.log("hereexcel")
    console.log("request File",req.file)
  if (!req.file || !req.file.path) {
    return next(new AppError('File not uploaded or path is invalid.', 400));
  }

  if (!req.file.mimetype.includes('spreadsheetml') && !req.file.originalname.endsWith('.xlsx')) {
    return next(new AppError('Please upload a valid Excel file (.xlsx)', 400));
  }

  const filePath = req.file.path;
  const workbook = xlsx.readFile(filePath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = xlsx.utils.sheet_to_json(worksheet);
  console.log(jsonData)
  if (!Array.isArray(jsonData) || jsonData.length === 0) {
    throw new AppError("Excel file is empty or data is not in the correct format.", 400);
  }

  const importedData = [];
  const errors = [];
  for (const [index, data] of jsonData.entries()) {
    try {
      const document = transformFn ? await transformFn(data) : new Model(data);
      console.log("Transformed Data:", document); // Log transformed user data
      const savedDocument = await document.save();
      importedData.push(savedDocument);
    } catch (error) {
      errors.push({ row: index + 1, error: error.message, data });
      continue; // Ensure processing continues for subsequent rows
    }
  }
  console.log("Returning from importFromExcel:", { importedData, errors });
return { importedData, errors };
});

// Utility function to export data to Excel
exports.exportToExcel = async (data, sheetName, fileName, res) => {
  try {
    // Convert data to plain JavaScript objects, ensuring subdocuments are included
    const dataObjects = data.map(item => item.toObject({ flattenMaps: true, minimize: false }));
    // minimize: false ensures empty objects or arrays are not removed.

    // Convert JSON data to worksheet
    const worksheet = xlsx.utils.json_to_sheet(dataObjects);
    const workbook = xlsx.utils.book_new(); // Create a new workbook
    xlsx.utils.book_append_sheet(workbook, worksheet, sheetName); // Append worksheet to workbook
    const filePath = path.join(__dirname, '../uploads', fileName); // Define file path

    // Ensure the directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Write workbook to file
    xlsx.writeFile(workbook, filePath);

    // Initiate download
    res.download(filePath, fileName, (err) => {
      if (err) {
        console.error('Failed to download file:', err);
        res.status(500).send('Failed to download file');
      } else {
        // console.log('File downloaded successfully');
        fs.unlinkSync(filePath); // Optionally delete the file after download
      }
    });

  } catch (err) {
    console.error('Failed to export data to Excel file:', err);
    res.status(500).send('Failed to export data to Excel file');
  }
};
