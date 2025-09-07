import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'


const prisma = new PrismaClient()


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })


const { email, code } = req.body
if (!email || !code) return res.status(400).json({ error: 'Missing fields' })


try {
const user = await prisma.user.findUnique({ where: { email } })
if (!user) return res.status(404).json({ error: 'User not found' })
if (user.confirmationCode !== code) return res.status(400).json({ error: 'Invalid code' })


await prisma.user.update({
where: { email },
data: { status: 'active', confirmationCode: null, emailVerified: true },
})


return res.status(200).json({ ok: true, message: 'Account verified' })
} catch (err) {
console.error(err)
return res.status(500).json({ error: 'Server error' })
}
}