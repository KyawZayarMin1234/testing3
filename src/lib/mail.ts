import nodemailer from 'nodemailer'


const transporter = nodemailer.createTransport({
host: process.env.MAIL_HOST,
port: Number(process.env.MAIL_PORT || 587),
auth: {
user: process.env.MAIL_USER,
pass: process.env.MAIL_PASS,
},
})


export async function sendEmail(to: string, subject: string, text: string, html?: string) {
const info = await transporter.sendMail({
from: process.env.MAIL_FROM,
to,
subject,
text,
html,
})
return info
}


export default transporter