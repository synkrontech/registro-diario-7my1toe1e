import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Verify the caller
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      },
    )

    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser()
    if (authError || !user) throw new Error('Unauthorized')

    // 2. Initialize Admin Client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // 3. Check Permissions (Must be admin or director)
    const { data: requesterProfile } = await supabaseAdmin
      .from('users')
      .select('roles(name)')
      .eq('id', user.id)
      .single()

    const requesterRole = requesterProfile?.roles?.name
    if (requesterRole !== 'admin' && requesterRole !== 'director') {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Insufficient permissions' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // 4. Parse Body
    const { email, password, nombre, apellido, role, activo } = await req.json()

    if (!email || !password || !nombre || !apellido || !role) {
      throw new Error('Missing required fields')
    }

    // 5. Create User in Auth
    const { data: newUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          nombre,
          apellido,
          role, // This triggers the handle_new_user trigger in the DB
        },
      })

    if (createError) throw createError

    // 6. Update 'activo' status if needed (Trigger might default to true or null)
    if (newUser.user) {
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ activo: activo })
        .eq('id', newUser.user.id)

      if (updateError) {
        // Log error but allow continuation as user is created
        console.error('Failed to update active status', updateError)
      }
    }

    return new Response(JSON.stringify(newUser), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
