import type { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'
import { sendEmail } from '../../lib/mail'


const prisma = new PrismaClient()


function generateCode() {
return Math.floor(100000 + Math.random() * 900000).toString() // 6 digits
}


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })


const { name, email, password, confirmPassword } = req.body
if (!name || !email || !password || !confirmPassword) {
return res.status(400).json({ error: 'All fields are required' })
}
if (password !== confirmPassword) {
return res.status(400).json({ error: 'Passwords do not match' })
}


try {
const existing = await prisma.user.findUnique({ where: { email } })
if (existing) return res.status(400).json({ error: 'Email already registered' })


const passwordHash = await bcrypt.hash(password, 10)
const code = generateCode()


const user = await prisma.user.create({
data: {
name,
email,
passwordHash,
provider: 'credentials',
status: 'pending',
confirmationCode: code,
emailVerified: false,
},
})


// send email
await sendEmail(
email,
'Confirm your account',
`Your confirmation code is ${code}`,
`<p>Your confirmation code is <strong>${code}</strong></p>`
)


return res.status(200).json({ ok: true, message: 'Confirmation code sent' })
} catch (err) {
console.error(err)
return res.status(500).json({ error: 'Server error' })
}
}