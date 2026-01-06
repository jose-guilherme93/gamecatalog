import { createLogger, format, transports } from 'winston'
import LokiTransport from 'winston-loki'

const { combine, timestamp, printf, splat } = format

const customFormat = printf(info => {

  return `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`
})

const logger = createLogger({
  level: 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    customFormat,
    splat(),
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'app.log' }),
    new LokiTransport({
      host: 'http://loki:3100',
      labels: { job: 'gamecatalog-app' },
      json: true,
      level: 'silly',
      format: format.combine(
        format.timestamp(),
        format.splat(),
        format.json(),
      ),
    }),
  ],
})

export default logger
