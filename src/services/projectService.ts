import { supabase } from '@/lib/supabase/client'
import { Project, ProjectFormValues, UserProfile } from '@/lib/types'

export const projectService = {
  async getProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select(
        `
        *,
        clients ( nombre ),
        systems ( nombre ),
        users ( nombre, apellido ),
        project_assignments ( user_id )
      `,
      )
      .order('nombre', { ascending: true })

    if (error) throw error

    return data.map((item: any) => ({
      ...item,
      client_name: item.clients?.nombre || 'Desconocido',
      system_name: item.systems?.nombre || '-',
      gerente_name: item.users
        ? `${item.users.nombre} ${item.users.apellido}`
        : '-',
      consultant_count: item.project_assignments?.length || 0,
      assigned_users:
        item.project_assignments?.map((pa: any) => pa.user_id) || [],
    })) as Project[]
  },

  async getManagers() {
    // Fetch users with 'gerente' role.
    const { data, error } = await supabase
      .from('users')
      .select(
        `
        id, nombre, apellido, email,
        roles!inner ( name )
      `,
      )
      .eq('roles.name', 'gerente')
      .eq('activo', true)
      .order('nombre')

    if (error) throw error

    return data.map((u: any) => ({
      id: u.id,
      nombre: u.nombre,
      apellido: u.apellido,
      email: u.email,
    })) as Partial<UserProfile>[]
  },

  async getConsultants() {
    // Fetch users with 'consultor' role.
    const { data, error } = await supabase
      .from('users')
      .select(
        `
        id, nombre, apellido, email,
        roles!inner ( name )
      `,
      )
      .eq('roles.name', 'consultor')
      .eq('activo', true)
      .order('nombre')

    if (error) throw error

    return data.map((u: any) => ({
      id: u.id,
      nombre: u.nombre,
      apellido: u.apellido,
      email: u.email,
    })) as Partial<UserProfile>[]
  },

  async createProject(project: ProjectFormValues) {
    const payload = {
      nombre: project.nombre,
      codigo: project.codigo,
      client_id: project.client_id,
      gerente_id: project.gerente_id || null,
      system_id: project.system_id || null,
      work_front: project.work_front || null,
      status: project.status,
    }

    const { data, error } = await supabase
      .from('projects')
      .insert(payload)
      .select()
      .single()

    if (error) throw error
    return data as Project
  },

  async updateProject(id: string, project: ProjectFormValues) {
    const payload = {
      nombre: project.nombre,
      codigo: project.codigo,
      client_id: project.client_id,
      gerente_id: project.gerente_id || null,
      system_id: project.system_id || null,
      work_front: project.work_front || null,
      status: project.status,
    }

    const { data, error } = await supabase
      .from('projects')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Project
  },

  async deleteProject(id: string) {
    const { error } = await supabase.from('projects').delete().eq('id', id)

    if (error) throw error
  },

  async updateProjectAssignments(projectId: string, newUserIds: string[]) {
    // 1. Get current assignments to know what to add and remove
    const { data: currentAssignments, error: fetchError } = await supabase
      .from('project_assignments')
      .select('user_id')
      .eq('project_id', projectId)

    if (fetchError) throw fetchError

    const currentUserIds = currentAssignments.map((a) => a.user_id)

    // 2. Calculate differences
    const toAdd = newUserIds.filter((id) => !currentUserIds.includes(id))
    const toRemove = currentUserIds.filter((id) => !newUserIds.includes(id))

    // 3. Insert new
    if (toAdd.length > 0) {
      const { error: insertError } = await supabase
        .from('project_assignments')
        .insert(toAdd.map((uid) => ({ project_id: projectId, user_id: uid })))
      if (insertError) throw insertError
    }

    // 4. Delete removed
    if (toRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from('project_assignments')
        .delete()
        .eq('project_id', projectId)
        .in('user_id', toRemove)
      if (deleteError) throw deleteError
    }
  },
}
