import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function resetPassword() {
  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()
  if (error) {
    console.error('Erreur liste utilisateurs:', error)
    return
  }

  console.log(`Total users: ${users.length}`)
  let oldAdmin = null;

  for (const user of users) {
    console.log(`User: ${user.email} (Phone: ${user.phone})`)
    
    // Check if user is an admin
    const { data: roles } = await supabaseAdmin.from('user_school_roles').select('*').eq('user_id', user.id)
    if (roles && roles.some(r => r.role === 'admin' || r.role === 'super_admin')) {
      console.log(` -> Cet utilisateur est administrateur (School: ${roles[0].school_id})`)
      
      // We assume the older admin (created first) is the one he wants
      if (!oldAdmin || new Date(user.created_at) < new Date(oldAdmin.created_at)) {
        oldAdmin = user;
      }
    }
  }

  if (oldAdmin) {
    console.log(`Ancien admin trouvé : ${oldAdmin.email}`)
    const newPassword = 'Password123!'
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(oldAdmin.id, {
      password: newPassword
    })
    
    if (updateError) {
      console.error('Erreur update:', updateError)
    } else {
      console.log(`SUCCESS! Le mot de passe de ${oldAdmin.email} a été réinitialisé à: ${newPassword}`)
    }
  }
}

resetPassword()
