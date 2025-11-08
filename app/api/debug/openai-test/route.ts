import { NextResponse } from 'next/server'
import { env } from '@/lib/config/env'
import OpenAI from 'openai'

export async function GET() {
  try {
    // Sadece development ortamında çalışsın
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Test endpoint only available in development' }, { status: 403 })
    }

    console.log('🔍 OpenAI Test - Environment Variables:')
    console.log('  OPENAI_API_KEY from process.env:', process.env.OPENAI_API_KEY?.substring(0, 20) + '...')
    console.log('  OPENAI_API_KEY from env:', env.OPENAI_API_KEY?.substring(0, 20) + '...')
    console.log('  Key lengths - process.env:', process.env.OPENAI_API_KEY?.length, 'env:', env.OPENAI_API_KEY?.length)

    // OpenAI client'ı oluştur
    const openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    })

    console.log('🔍 OpenAI Test - Client created successfully')

    // Basit bir test isteği gönder
    console.log('🔍 OpenAI Test - Sending test request...')
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: 'Say "Hello" in Turkish' }
      ],
      max_tokens: 10,
    })

    console.log('🔍 OpenAI Test - Response received:', response.choices[0]?.message?.content)

    return NextResponse.json({
      success: true,
      response: response.choices[0]?.message?.content,
      model_used: response.model,
      usage: response.usage,
    })

  } catch (error: any) {
    console.error('❌ OpenAI Test Error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      type: error.type,
      code: error.code,
      status: error.status,
    }, { status: 500 })
  }
}