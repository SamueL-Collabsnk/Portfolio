// Simple Node.js backend for sending emails from contact form
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Configure your email transport (use your real credentials)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your.email@gmail.com', // replace with your email
        pass: 'yourpassword' // replace with your password or app password
    }
});

app.post('/send-email', async (req, res) => {
    const { name, email, message } = req.body;
    try {
        await transporter.sendMail({
            from: email,
            to: 'your.email@gmail.com', // your receiving email
            subject: `Portfolio Contact: ${name}`,
            text: message,
            html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p>${message}</p>`
        });
        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
