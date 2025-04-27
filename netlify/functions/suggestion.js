import { NowRequest, NowResponse } from '@vercel/node'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export default async function (req = NowRequest, res = NowResponse) {
  const { mood, entryText, sentiment } = req.body
  const prompt = `
Usuário relatou: "${entryText}"
Humor detectado: ${sentiment.label} (${sentiment.score.toFixed(2)}).
Em português, gere uma única mensagem que comece com um mini-mantra ou frase de acolhimento
e em seguida ofereça uma dica prática de autocuidado relacionada a esse estado.
  `
  const completion = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
  })
  return res.json({ suggestion: completion.choices[0].message.content.trim() })
}
