
// exports.importUser = catchAsync(async (req, res, next) => {
//   console.log('usersexcelhere');
//   console.log('request File', req.file);

//   // Check if the file exists and is an Excel file
//   if (!req.file || !req.file.path) {
//     return next(new AppError('File not uploaded or path is invalid.', 400));
//   }

//   if (
//     !req.file.mimetype.includes('spreadsheetml') &&
//     !req.file.originalname.endsWith('.xlsx')
//   ) {
//     return next(new AppError('Please upload a valid Excel file (.xlsx)', 400));
//   }

//   const filePath = req.file.path;

//   // Validate and transform payment data
//   const validateAndTransformData = async (data) => {
//    // console.log('Validating data:', data); // Log incoming data

//     // Required fields for validation
//     const requiredFields = [
//       'businessId',
//       'warehouseId',
//       'roleId',
//       'fullName',
//       'phoneNumber',
//       'email',
//       'password',
//       'isActive',
//       'address',
//     ];
//     console.log("requiredFields",requiredFields)

//     const missingFields = requiredFields.filter((field) => !data[field]);

//     if (missingFields.length > 0) {
//       return next(new AppError(`Missing required fields: ${missingFields.join(', ')}`,400))};

//     const user = {
//       businessId:data.businessId,
//       warehouseId:data.warehouseId,
//       roleId:data.roleId,
//       fullName:data.fullName,
//       phoneNumber: String(data.phoneNumber),
//       email: String(data.email).toLowerCase(),
//       password: String(data.password),
//       isActive: Boolean(data.isActive),
//       address:data.address,
//       profileImage:null

      
//     };
//     return user;
//   };

//   // Process the Excel file and import payments
//   const importFromExcel = async () => {
//     const workbook = xlsx.readFile(filePath);
//     const worksheet = workbook.Sheets[workbook.SheetNames[0]];
//     const jsonData = xlsx.utils.sheet_to_json(worksheet); // Convert the sheet to JSON

//     if (!Array.isArray(jsonData) || jsonData.length === 0) {
//       throw new AppError(
//         'Excel file is empty or data is not in the correct format.',
//         400
//       );
//     }

//     const importedData = [];
//     const errors = [];

//     for (const [index, data] of jsonData.entries()) {
//       try {
//         const userDocument = await validateAndTransformData(data);
//         console.log('Transformed Users:', userDocument); // Log transformed user data
//         const savedUser = await User.create(userDocument); // Save the user to the database
//          importedData.push(savedUser);
//         console.log('Saved Users:', savedUser); // Log saved User
//       } catch (error) {
//         console.log("DATABASE ERROR:", error);
//         errors.push({ row: index + 1, error: error.message, data });
//       }
//     }

//     console.log('Imported Data:', importedData); // Log final imported data
//     return { importedData, errors };
//   };

//   const { importedData, errors } = await importFromExcel();
//   console.log('Imported Data:', importedData);

//   // Cleanup: Remove uploaded file after processing
//   fs.unlinkSync(filePath);

//   if (!importedData.length) {
//     return next(
//       new AppError('No valid Users were imported from the file.', 400)
//     );
//   }

//   res.status(200).json({
//     status: 1,
//     message:
//       errors.length > 0
//         ? 'Import completed with some errors'
//         : 'Data imported successfully',
//     successCount: importedData.length,
//     errorCount: errors.length,
//     errors,
//     importedUsers: importedData,
//   });
// });

// exports.exportUser = catchAsync(async (req, res, next) => {
//   const {format = "excel",sortBy = "createdAt", sortOrder = "desc", page = 1,limit = 1000} = req.query;

//   const whereQuery = buildUserWhereClause(req.query);
//   const validSortColumns = ["createdAt", "updatedAt", "fullName", "email"];
//   const orderColumn = validSortColumns.includes(sortBy) ? sortBy : "createdAt";
//   const orderDirection = sortOrder.toLowerCase() === "asc" ? "ASC" : "DESC";

//   const users = await User.findAll({
//     where: whereQuery,
//     include: [
//       { model: Role, as: "role", attributes: ["id", "name"] },
//       { model: Warehouse, as: "warehouse", attributes: ["id", "name"] }
//     ],
//     order: [[orderColumn, orderDirection]],
//     limit: Number(limit),
//     offset: (page - 1) * limit
//   });

//   if (!users.length)  return next(new AppError("No users found for the given filters.", 404));
  
//   // --- Prepare data for export ---
//   const formattedUsers = users.map(u => ({
//     id: u.id,
//     fullName: u.fullName,
//     email: u.email,
//     phoneNumber: u.phoneNumber,
//     roleName: u.role?.name || "N/A",
//     warehouseName: u.warehouse?.name || "N/A",
//     isActive: u.isActive ? "Yes" : "No"
//   }));

//     const workbook = new ExcelJS.Workbook();
//     const worksheet = workbook.addWorksheet("Users");

//     worksheet.columns = [
//       { header: "ID", key: "id", width: 10 },
//       { header: "Full Name", key: "fullName", width: 25 },
//       { header: "Email", key: "email", width: 30 },
//       { header: "Phone", key: "phoneNumber", width: 20 },
//       { header: "Role", key: "roleName", width: 20 },
//       { header: "Warehouse", key: "warehouseName", width: 25 },
//       { header: "Active", key: "isActive", width: 10 }
//     ];

//     formattedUsers.forEach(user => worksheet.addRow(user));

//     res.setHeader(
//       "Content-Type",
//       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//     );
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename=users-${Date.now()}.xlsx`
//     );

//     await workbook.xlsx.write(res);
//     return res.end();
//   }
// );