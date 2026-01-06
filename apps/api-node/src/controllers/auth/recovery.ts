import logger from '../../scripts/logger.js'
import type { Response, Request } from 'express'
import * as crypto from 'node:crypto'
import { createTransport } from 'nodemailer'
import * as z from 'zod'
import { searchEmailRegistered } from '../../models/authModel.js'
import { insertRecoveryTokenInDB } from '../../models/authModel.js'

const emailSchema = z.object({
  email: z.email().min(4).max(100),
})

export const recoveryController = async (req: Request, res: Response) => {
  const { email }  = req.body
  if (!email) {
    return res.status(400).json({ message: 'insira um email válido' })
  }
  emailSchema.parse({ email })
  logger.info(`try to recovery password with: ${email}`)
  const recoveryToken = crypto.randomBytes(32).toString('hex')
  const responseDbSearch = await searchEmailRegistered(email)

  if(!responseDbSearch.rowCount) {
    logger.warn('email not found')
    return res.status(404).json({ message: 'Email não cadastrado' })
  } else {

    await insertRecoveryTokenInDB(responseDbSearch.rows[0]!, recoveryToken)
  }

  try {
    const transporter = createTransport({
      host: 'sandbox.smtp.mailtrap.io',
      port: 2525,
      auth: {
        user: process.env.USERNAME_MAILER!,
        pass: process.env.USER_PASSWORD_TRANSPORTER_MAILER!,
      },
    })
    transporter.verify((error, sucess) => {
      logger.info(`Transporter verify error: ${error}`)
      logger.info(`Transporter verify sucess: ${sucess}`)
    },
    )
    const userEmail = responseDbSearch.rows[0]!.email
    async function sendEmail() { {
      const infoTransporterSendmail = await transporter.sendMail({
        from: '"Maddison Foo Koch" <maddison53@ethereal.email>',
        to: userEmail?.toString(),
        subject: 'Redefinição de senha de usuário',
        text: '',
        html: `<p> Para redefinir sua senha GameCatalog, clique no link abaixo <p/>
    <a href="http://localhost:3000/auth/reset-password/?recoveryToken=${recoveryToken}">
            Redefinir Senha
          </a>
          <p> Se você não solicitou essa alteração, ignore este e-mail. <p/>`,
      })
      logger.info(`infoTransporterSendmail.messageId:', ${infoTransporterSendmail.messageId}`)
      logger.info(`infoTransporterSendmail.rejected:, ${infoTransporterSendmail.rejected}`)
      logger.info(`infoTransporterSendmail.response:, ${infoTransporterSendmail.response}`)

    } }

    sendEmail().catch((error) => logger.error('Error in sendEmail function:', error))
  } catch (error) {
    logger.error('Error sending email:',  error)
  }

  logger.info('email found, recovery token inserted in db')
  res.status(200).json({
    message: 'email encontrado. inserindo na tabela recovery...',
    data: responseDbSearch.rows[0]!.email,
    code: recoveryToken,
  })
}
