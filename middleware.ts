import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Allow auth routes and public landing page to be accessed by non-authenticated users
  if (!user && (pathname === '/' || pathname.startsWith('/connexion') || pathname.startsWith('/inscription-ecole') || pathname.startsWith('/activer-parent'))) {
    return supabaseResponse
  }

  // Redirect to login if unauthenticated and not on auth pages
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/connexion'
    return NextResponse.redirect(url)
  }

  // Check if user is a super admin
  const { data: superAdmins } = await supabase
    .from('super_admins')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)

  const isSuperAdmin = superAdmins && superAdmins.length > 0

  // If user is authenticated, find their role
  const { data: roles } = await supabase
    .from('user_school_roles')
    .select('role, school_id')
    .eq('user_id', user.id)
    .limit(1)

  let userRole = roles && roles.length > 0 ? roles[0].role : null
  const schoolId = roles && roles.length > 0 ? roles[0].school_id : null

  if (isSuperAdmin && !userRole) {
    userRole = 'super_admin'
  }

  if (!userRole) {
    // Authenticated but no role assigned
    // This happens when a user signs up with Google (OAuth) but hasn't created their school yet.
    if (pathname === '/onboarding' || pathname.startsWith('/api/')) {
      return supabaseResponse
    }
    
    // Redirect to onboarding so they can finish setting up their school
    const url = request.nextUrl.clone()
    url.pathname = '/onboarding'
    return NextResponse.redirect(url)
  }

  // Define route mapping
  const routePrefix = `/${userRole}` // e.g. /admin, /enseignant, /comptable, /parent
  
  // If user is going to the root or an auth page, redirect them to their dashboard
  if (pathname === '/' || pathname.startsWith('/connexion') || pathname.startsWith('/inscription-ecole') || pathname.startsWith('/activer-parent')) {
    const url = request.nextUrl.clone()
    url.pathname = routePrefix
    return NextResponse.redirect(url)
  }

  // Enforce role-based access control for protected routes
  const protectedGroups = ['/admin', '/enseignant', '/comptable', '/parent', '/super_admin']
  const attemptingToAccess = protectedGroups.find(group => pathname.startsWith(group))

  if (attemptingToAccess) {
    if (isSuperAdmin) {
      // Super admins can access everything, no restriction
    } else if (attemptingToAccess !== routePrefix) {
      // User is trying to access another role's route
      const url = request.nextUrl.clone()
      url.pathname = routePrefix
      return NextResponse.redirect(url)
    }

    // Check school suspension status for non-super admins
    if (!isSuperAdmin && schoolId && pathname !== '/suspended') {
      const { data: school } = await supabase
        .from('schools')
        .select('subscription_status')
        .eq('id', schoolId)
        .single()
        
      if (school && school.subscription_status === 'suspended') {
        const url = request.nextUrl.clone()
        url.pathname = '/suspended'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
