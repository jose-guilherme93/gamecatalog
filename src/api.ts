import axios from 'axios'

import 'dotenv/config'

import { pool } from './utils/connectDatabase.js'

import 'dotenv/config'

/**
 * Função para popular o banco.
 * Pode ser chamada no início da aplicação ou via rota.
 */
export const seedGamesFromAPI = async () => {
  const client = await pool.connect()
  const API_KEY = process.env.RAWG_API_KEY
  console.log(API_KEY)
  try {
    console.log('--- Iniciando Sincronização de Jogos ---')

    // 1. Busca lista de jogos (Top 20 mais populares)
    const { data } = await axios.get('https://api.rawg.io/api/games', {
      params: { key: API_KEY, page_size: 20, ordering: '-added' },
    })

    for (const game of data.results) {
      // 2. Busca o detalhe para obter a descrição (storyline)
      // A listagem geral não traz o texto completo
      const detailRes = await axios.get(`https://api.rawg.io/api/games/${game.id}?key=${API_KEY}`)
      const detail = detailRes.data

      const query = `
        INSERT INTO "games" (
          title, 
          rating, 
          storyline, 
          plataform, 
          first_release_date, 
          cover_url, 
          slug, 
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT (slug) 
        DO UPDATE SET 
          title = EXCLUDED.title,
          storyline = EXCLUDED.storyline,
          cover_url = EXCLUDED.cover_url,
          updated_at = NOW()
        RETURNING id
      `

      const values = [
        detail.name,
        0, // Rating inicial (sua avaliação)
        detail.description_raw || detail.description || 'N/A',
        detail.platforms?.map((p: any) => p.platform.name).join(', '),
        detail.released || null,
        detail.background_image,
        detail.slug,
      ]

      const res = await client.query(query, values)
      console.log(`✔ Processado: ${detail.name} (ID: ${res.rows[0].id})`)
    }

    console.log('--- Sincronização Finalizada com Sucesso ---')
  } catch (error) {
    // Tratamento de erro detalhado para facilitar o debug
    if (error.code === '42P10') {
      console.error('❌ Erro de Banco: Você esqueceu de adicionar a constraint UNIQUE no slug!')
      console.error('Execute: ALTER TABLE "games" ADD CONSTRAINT unique_game_slug UNIQUE (slug);')
    } else {
      console.error('❌ Erro na sincronização:', error.message)
    }
  } finally {
    client.release()
  }
}
seedGamesFromAPI()
