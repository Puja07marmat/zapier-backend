"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
// SOL_PRIVATE_KEY=""
// SMTP_USERNAME=""
// SMTP_PASSWORD=""
// SMTP_ENDPOINT
const transport = nodemailer_1.default.createTransport({
    host: process.env.SMTP_ENDPOINT,
    port: 587,
    secure: false, // upgrade later with STARTTLS
    auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
    },
});
async function sendEmail(to, body) {
    await transport.sendMail({
        from: "9ecc24001@smtp-brevo.com",
        sender: "9ecc24001@smtp-brevo.com",
        to,
        subject: "Hello from Zapier",
        text: body
    });
}
