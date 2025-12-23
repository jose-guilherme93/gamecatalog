import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Response, Request } from 'express'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export async function getDocs(req: Request, res: Response) {
  const file = req.params[0] || 'index.html'
  const filePath = path.join(__dirname, '..', 'docs', file)

  res.sendFile(filePath, (err) => {
    if (err) {
      res.status(404).send('Documentação não encontrada')
    }
  })
}
