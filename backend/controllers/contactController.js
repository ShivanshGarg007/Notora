const nodemailer = require('nodemailer');

exports.sendContactEmail = async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    // Configure transporter (use your real SMTP credentials in production)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.CONTACT_EMAIL_USER || 'shivanshgarg007@gmail.com',
        pass: process.env.CONTACT_EMAIL_PASS || 'your-app-password-here',
      },
    });

    await transporter.sendMail({
      from: 'support@notora.com', // Shown as sender
      to: 'shivanshgarg007@gmail.com', // Where the email is actually sent
      subject: 'New Contact Form Submission',
      replyTo: email,
      text: `From: ${name} <${email}>\n\n${message}`,
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Contact form email error:', err);
    res.status(500).json({ error: 'Failed to send message. Please try again later.' });
  }
}; 