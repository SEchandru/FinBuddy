const nodemailer = require('nodemailer');

let transporterPromise = (async () => {
  // If local SMTP environment is configured, use it
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    console.log(`Using custom SMTP transport: ${process.env.SMTP_HOST}`);
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: parseInt(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  } else {
    // Generate developer test Ethereal SMTP account
    console.log("No custom SMTP configured. Generating temporary Ethereal Mail credentials...");
    try {
      const testAccount = await nodemailer.createTestAccount();
      console.log(`Generated Ethereal SMTP test credentials:`);
      console.log(`  User: ${testAccount.user}`);
      console.log(`  Pass: ${testAccount.pass}`);
      return nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    } catch (err) {
      console.error("Failed to generate Ethereal credentials, falling back to dummy console logger:", err);
      return {
        sendMail: async (options) => {
          console.log("--- MOCK EMAIL SENDER ---");
          console.log(`To: ${options.to}`);
          console.log(`Subject: ${options.subject}`);
          console.log(`Body: ${options.html}`);
          console.log("-------------------------");
          return { messageId: 'mock-id-12345' };
        }
      };
    }
  }
})();

const sendEmail = async (options) => {
  try {
    const transporter = await transporterPromise;
    const mailOptions = {
      from: process.env.SMTP_FROM || 'reports@finbuddy.com',
      to: options.to,
      subject: options.subject,
      html: options.html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email dispatched: messageId = ${info.messageId}`);
    
    // Check if Ethereal message URL is available
    if (typeof nodemailer.getTestMessageUrl === 'function') {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`Ethereal Email Review Link: ${previewUrl}`);
        return { success: true, messageId: info.messageId, previewUrl };
      }
    }
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Nodemailer transmission failure:", error);
    throw error;
  }
};

module.exports = { sendEmail };
