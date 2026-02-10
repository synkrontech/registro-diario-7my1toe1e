import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

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

    // In a real scenario, integrate with Resend, SendGrid, etc.
    // For this implementation, we log the email intent.
    console.log(`[Email Service] Sending email to: ${to}`)
    console.log(`[Email Service] Type: ${type}`)
    console.log(`[Email Service] Data:`, data)

    let subject = ''
    let body = ''

    if (type === 'status_change') {
      const status = data.status === 'active' ? 'Activada' : 'Desactivada'
      subject = `Tu cuenta ha sido ${status}`
      body = `Hola ${name},\n\nTu cuenta en Registro Diario ha sido ${status} por un administrador.\n\n${
        data.status === 'active'
          ? 'Ya puedes iniciar sesión en el sistema.'
          : 'Si crees que esto es un error, contacta a soporte.'
      }`
    } else if (type === 'welcome_admin') {
      subject = 'Nuevo usuario registrado'
      body = `Hola Admin,\n\nEl usuario ${name} (${to}) se ha registrado y requiere aprobación.`
    }

    console.log(`[Email Service] Content: \nSubject: ${subject}\nBody: ${body}`)

    return new Response(
      JSON.stringify({ success: true, message: 'Email queued' }),
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
