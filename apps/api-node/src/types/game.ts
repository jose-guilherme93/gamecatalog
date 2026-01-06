import * as z from 'zod'
export interface Game {
  id: string;
  title: string;
  rating: number;
  status: string;
  review: string;
  slug: string;
  storyline: string;
  cover_url: string;
  plataform: string;
  first_release_date: string;
}

export const gameTitleSearchSchema = z.string().min(3, 'forneça pelo menos 3 letras')
export type gameTitleSearch = z.infer<typeof gameTitleSearchSchema>

export const gameApiSearchSchema = z.object({
  name: z.string(),
  slug: z.slugify(),
  background_image: z.string(),
  released: z.date(),
})

export type gameApiSearch = z.infer< typeof gameApiSearchSchema>
