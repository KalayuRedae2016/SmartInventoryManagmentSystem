const nodemailer = require('nodemailer');
const catchAsync = require('./catchAsync');

exports.sendEmail = catchAsync(async (options) => {
  // Configure the transporter for Gmail
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: process.env.EMAIL_HOST,
    port: 587,
    secure: false, //// Use `true` for port 465, `false` for all other port
    auth: {
      user:process.env. EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  // 2) Define the email options
  const mailOptions = {
    from: process.env.EMAIL_HOST,
    to: options.email,
    subject: options.subject,
    text: options.message,
    //html:options.message
  };
  transporter.verify((error, success) => {
    if (error) {
      //console.log(error);
    } else {
      // console.log('Server is ready to take our messages');
    }
  });
  return transporter.sendMail(mailOptions)
   
});

exports.sendWelcomeEmail = async (user, password) => {
  const subject = 'Welcome to Smart Inventory Management System 🎉';

  const email = user.email;

  const loginLink =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:8083'
      : 'https://grandinventory.com';

  const message = `
Hi ${user.fullName},

Welcome to the Smart Inventory Management System!

Your account has been successfully created. Below are your login details:

----------------------------------------
Full Name : ${user.fullName}
Email     : ${email}
PhoneNumber  : ${user.phoneNumber}
Password  : ${password}
----------------------------------------

🔐 For security reasons, we strongly recommend changing your password immediately after your first login.

You can access your account here:
${loginLink}

With our system, you can manage inventory efficiently and securely.

If you need any assistance, our support team is always ready to help.

We’re excited to have you on board!

Best regards,
Smart Inventory Management System Team
${loginLink}
`;

  await exports.sendEmail({ email, subject, message });
};

exports.emailBusinessDetail = async (user, role,password) => {
  const subject='Welcome to Smart Inventory Managment System!'
  const email = user.email;
  const loginLink = process.env.NODE_ENV === 'development' 
    ? 'https://grandinventory.com or http://localhost:8083'
    : 'https://grandinventory.com';

  const message = `Hi ${user.fullName},
  
  Welcome to Our Platform! We're excited to have you on board.
  
  Here are your account details:
  - FullName: ${user.fullName}
  -role: ${role}
  - Email: ${email}
  -phoneNumber: ${user.phoneNumber}
  - address: ${user.address}
  - Password: ${password}
  -Login here: ${loginLink}
  
  Please visit our platform to explore our Inventory Services.
  If you have any questions or need assistance, feel free to contact our support team.
  
  Best regards,
  Grand Inventory managment Sysetem Group Team`;

  // console.log("subb",subject,email,message)
  await exports.sendEmail({ email, subject, message });

};
