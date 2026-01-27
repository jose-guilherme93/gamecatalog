import { createLogger, format, transports } from 'winston'
import LokiTransport from 'winston-loki'

const { combine, timestamp, printf, splat, json } = format

// Definição de formato customizado para legibilidade no console/arquivo
const customFormat = printf(({ timestamp, level, message }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message}`
})

const Loki = LokiTransport.default || LokiTransport

const logger = createLogger({
    level: 'info',
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        splat(),
        customFormat
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: 'app.log' }),
        new Loki({
            host: 'http://loki:3100',
            labels: { job: 'gamecatalog-app' },
            json: true,
            level: 'silly',
            format: combine(
                timestamp(),
                splat(),
                json()
            )
        })
    ]
})

export default logger