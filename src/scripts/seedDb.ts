import { pool } from '../utils/connectDatabase.js'
import { randomUUID } from 'crypto'
import logger from './logger.js'

const seed = async () => {
  try {
    logger.info('🔄 Limpando tabelas...')
    await pool.query('DELETE FROM reviews')
    await pool.query('DELETE FROM games')
    await pool.query('DELETE FROM users')

    const userIds = []
    const gameIds = []

    logger.info('👤 Inserindo 500 usuários...')
    for (let i = 1; i <= 500; i++) {
      const id = randomUUID()
      userIds.push(id)
      await pool.query(
        `INSERT INTO users (id, username, email, password_hash, avatar)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          id,
          `user_${i}`,
          `user${i}@example.com`,
          `senha_hash_${i}`,
          `https://example.com/avatar${i}.png`,
        ],
      )
    }

    logger.info('🎮 Inserindo 500 jogos...')
    for (let i = 1; i <= 500; i++) {
      const result = await pool.query(
        `INSERT INTO games (title, rating, status, review, plataform, first_release_date, storyline, cover_url, slug)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          `Jogo ${i}`,
          (Math.random() * 10).toFixed(1),
          'Jogando',
          `Review do jogo ${i}`,
          'PC',
          new Date(2025, 0, i % 31 + 1),
          `História do jogo ${i}`,
          `https://example.com/cover${i}.jpg`,
          `jogo-${i}`,
        ],
      )
      gameIds.push(result.rows[0].id)
    }

    logger.info('📝 Inserindo 500 reviews...')
    for (let i = 0; i < 500; i++) {
      await pool.query(
        `INSERT INTO reviews (game_id, user_id, review_text, score)
         VALUES ($1, $2, $3, $4)`,
        [
          gameIds[i],
          userIds[i],
          `Review do usuário ${i + 1} para o jogo ${i + 1}`,
          (Math.random() * 10).toFixed(1),
        ],
      )
    }

    logger.info('✅ Seed finalizado com sucesso!')
    pool.end()
  } catch (err) {
    console.error('❌ Erro ao rodar seed:', err)
    pool.end()
  }
}

seed()
