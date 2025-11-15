/**
 * Realtime Connection Test
 *
 * Bu script Supabase Realtime bağlantısını test eder
 */

import { createClient } from '@/lib/supabase/client'

async function testRealtimeConnection() {
  console.log('🔍 Testing Supabase Realtime connection...\n')

  const supabase = createClient()

  // Test 1: Basic connection
  console.log('1️⃣ Testing basic Realtime connection...')
  const testChannel = supabase.channel('test-connection', {
    config: {
      broadcast: { self: true },
    },
  })

  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      testChannel.unsubscribe()
      reject(new Error('Connection test timed out after 10 seconds'))
    }, 10000)

    testChannel
      .on('broadcast', { event: 'test' }, () => {
        console.log('✅ Broadcast received')
      })
      .subscribe((status) => {
        console.log(`📡 Subscription status: ${status}`)

        if (status === 'SUBSCRIBED') {
          console.log('✅ Realtime connection successful!')
          clearTimeout(timeout)
          testChannel.unsubscribe()
          resolve()
        } else if (status === 'TIMED_OUT') {
          clearTimeout(timeout)
          testChannel.unsubscribe()
          reject(
            new Error(
              '❌ Realtime connection timed out. Please check Supabase Dashboard > Settings > API > Realtime is enabled.'
            )
          )
        } else if (status === 'CHANNEL_ERROR') {
          clearTimeout(timeout)
          testChannel.unsubscribe()
          reject(new Error('❌ Realtime channel error. Please check your Supabase configuration.'))
        } else if (status === 'CLOSED') {
          clearTimeout(timeout)
          testChannel.unsubscribe()
          reject(new Error('❌ Realtime channel closed unexpectedly.'))
        }
      })
  })
}

// Run test if called directly
if (typeof window !== 'undefined') {
  testRealtimeConnection()
    .then(() => {
      console.log('\n✅ All tests passed!')
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error.message)
      console.error('\n💡 Troubleshooting:')
      console.error('1. Go to Supabase Dashboard > Settings > API')
      console.error('2. Check if "Realtime" is enabled')
      console.error(
        '3. Verify your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are correct'
      )
    })
}

export { testRealtimeConnection }

