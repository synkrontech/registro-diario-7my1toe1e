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
        users ( nombre, apellido )
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
    })) as Project[]
  },

  async getManagers() {
    // Fetch users with 'gerente' role.
    // We assume the role name is 'gerente' in the roles table.
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

  async createProject(project: ProjectFormValues) {
    // Ensure undefined is handled as null for optional foreign keys if necessary,
    // though Supabase usually handles optional fields if they are nullable in DB.
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
}
