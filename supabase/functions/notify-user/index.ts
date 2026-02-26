import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, name, type, data } = await req.json()

    // Connect to Supabase to fetch templates
    // Use service role key to access email_templates table (protected)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    let subject = ''
    let body = ''
    let templateSlug = ''

    // Determine which template to use based on type
    if (type === 'status_change') {
      if (data.status === 'active') {
        templateSlug = 'user_approval'
      } else {
        templateSlug = 'user_rejection'
      }
    } else if (type === 'welcome_admin') {
      templateSlug = 'admin_new_user'
    } else if (type === 'registration') {
      templateSlug = 'user_registration'
    }

    if (templateSlug) {
      const { data: template } = await supabaseAdmin
        .from('email_templates')
        .select('*')
        .eq('slug', templateSlug)
        .single()

      if (template) {
        subject = template.subject
        body = template.body
      }
    }

    // Fallback if no template found or manual processing needed
    if (!subject) {
      subject = `Notificación: ${type}`
      body = `Hola ${name},\n\nTienes una nueva notificación de tipo ${type}.`
    }

    // Replace variables
    // Variables: {{nombre}}, {{email}}, {{url}}, {{reason}}
    body = body.replace(/{{nombre}}/g, name)
    body = body.replace(/{{email}}/g, to)
    body = body.replace(/{{url}}/g, 'https://synkrontech.goskip.app') // Or env var
    body = body.replace(/{{reason}}/g, data?.reason || 'Administración')

    console.log(`[Email Service] Sending email to: ${to}`)
    console.log(`[Email Service] Subject: ${subject}`)
    console.log(`[Email Service] Body preview: ${body.substring(0, 50)}...`)

    // Integration with actual email provider would go here (Resend, etc.)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email processed via template',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
