import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaClient } from '@prisma/client'
import { sendEmail } from '@/lib/mail'


const prisma = new PrismaClient()


export default NextAuth({
providers: [
GoogleProvider({
clientId: process.env.GOOGLE_CLIENT_ID!,
clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
}),
],
secret: process.env.NEXTAUTH_SECRET,
callbacks: {
async signIn({ user, account, profile }) {
// user.email, user.name available
if (!user.email) return false


// find or create local user record
let dbUser = await prisma.user.findUnique({ where: { email: user.email } })
if (!dbUser) {
// If Google already verifies email, we can mark active immediately
const isVerified = (profile as any)?.email_verified ?? false
dbUser = await prisma.user.create({
data: {
name: user.name,
email: user.email,
provider: 'google',
status: isVerified ? 'active' : 'pending',
emailVerified: Boolean(isVerified),
},
})


// If not verified by Google, optionally send an email with code or link
if (!isVerified) {
const code = Math.floor(100000 + Math.random() * 900000).toString()
await prisma.user.update({ where: { email: user.email }, data: { confirmationCode: code } })
await sendEmail(user.email, 'Confirm your Google sign-in', `Your confirmation code: ${code}`)
}
}


// If user exists but status is pending, disallow sign in until verified (optional)
if (dbUser && dbUser.status === 'pending') {
// You can return false to block sign in; or return true but redirect to confirmation page.
return true // allow login but check on frontend that user.status === 'pending'
}


return true
},
async session({ session, token, user }) {
// Attach status to session by loading from DB
if (session?.user?.email) {
const dbUser = await prisma.user.findUnique({ where: { email: session.user.email } })
if (dbUser) {
(session as any).user.status = dbUser.status
(session as any).user.provider = dbUser.provider
}
}
return session
},
},
})