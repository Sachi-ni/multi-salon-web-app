import dotenv from 'dotenv';
import { sendEmail } from '../utils/sendEmail.js';
dotenv.config();

const EMAIL_PATTERN = /^[^\s@]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,63}$/;
const GENERIC_PHONE_PATTERN = /^\+?[0-9]{10}$/;
const normalizePhone = (phone) => String(phone || "").trim().replace(/[\s()-]/g, "");

export const sendContactMessage = async (req, res) => {
  const { firstName, lastName, email, contactNumber, subject, message } = req.body;

  if (!firstName || !lastName || !email || !contactNumber || !subject || !message) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedPhone = normalizePhone(contactNumber);
  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }
  if (!GENERIC_PHONE_PATTERN.test(normalizedPhone)) {
    return res.status(400).json({ message: 'Phone number must contain exactly 10 digits and may start with +.' });
  }

  try {
    const result = await sendEmail({
      to: process.env.SUPERADMIN_EMAIL,
      subject: `New Contact Form Message: ${subject}`,
      text: `You have received a new message from the contact form.\n\nName: ${firstName} ${lastName}\nEmail: ${normalizedEmail}\nContact number: ${normalizedPhone}\nSubject: ${subject}\nMessage:\n${message}`,
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${normalizedEmail}</p>
        <p><strong>Contact number:</strong> ${normalizedPhone}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
      fromName: 'SalonHub Contact Form',
    });

    if (!result.delivered) {
      console.error('Contact form email delivery failed.');
      return res.status(500).json({ message: 'Failed to send message. Please try again later.' });
    }

    console.log(`Contact form message delivered via ${result.provider}.`);
    res.status(200).json({ message: 'Message sent successfully.' });
  } catch (error) {
    console.error('Error sending email:', error.message);
    res.status(500).json({ message: 'Failed to send message. Please try again later.' });
  }
};
