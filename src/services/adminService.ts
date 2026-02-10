import { supabase } from '@/lib/supabase/client'
import {
  UserProfile,
  Role,
  Permission,
  AuditLog,
  Notification,
  EmailTemplate,
  Project,
  Client,
} from '@/lib/types'

export const adminService = {
  // --- USERS ---
  async getUsers() {
    const { data, error } = await supabase
      .from('users')
      .select(
        `
        *,
        roles (
          id,
          name
        )
      `,
      )
      .order('created_at', { ascending: false })

    if (error) throw error

    return data.map((user: any) => ({
      ...user,
      role: user.roles?.name || 'unknown',
      role_id: user.role_id,
    })) as UserProfile[]
  },

  async createUser(data: {
    email: string
    password: string
    nombre: string
    apellido: string
    role: string
    activo: boolean
  }) {
    // Call Edge Function to create user securely
    const { data: result, error } = await supabase.functions.invoke(
      'create-user',
      {
        body: data,
      },
    )

    if (error) throw error
    if (result && result.error) throw new Error(result.error)

    return result
  },

  async updateUser(
    adminId: string,
    userId: string,
    data: {
      nombre: string
      apellido: string
      role_id: string
      role_name: string
      activo: boolean
    },
  ) {
    const { error } = await supabase
      .from('users')
      .update({
        nombre: data.nombre,
        apellido: data.apellido,
        role_id: data.role_id,
        activo: data.activo,
      })
      .eq('id', userId)

    if (error) throw error

    await this.logAction(adminId, 'UPDATE_USER', userId, {
      updated_fields: data,
    })
  },

  async updateUserStatus(adminId: string, userId: string, newStatus: boolean) {
    const { error } = await supabase
      .from('users')
      .update({ activo: newStatus })
      .eq('id', userId)

    if (error) throw error

    await this.logAction(adminId, 'UPDATE_STATUS', userId, {
      new_status: newStatus,
    })

    await this.notifyUser(userId, 'status_change', {
      status: newStatus ? 'active' : 'inactive',
    })
  },

  async updateUserRole(
    adminId: string,
    userId: string,
    roleId: string,
    roleName: string,
  ) {
    const { error } = await supabase
      .from('users')
      .update({ role_id: roleId })
      .eq('id', userId)

    if (error) throw error

    await this.logAction(adminId, 'UPDATE_ROLE', userId, {
      new_role_id: roleId,
      new_role_name: roleName,
    })
  },

  // --- ROLES & PERMISSIONS ---
  async getRoles() {
    const { data, error } = await supabase
      .from('roles')
      .select(
        `
        *,
        role_permissions (
          permissions (
            id,
            code,
            description,
            resource_id,
            resource_type
          )
        )
      `,
      )
      .order('name')

    if (error) throw error

    return data.map((role: any) => ({
      ...role,
      permissions: role.role_permissions.map((rp: any) => rp.permissions),
    })) as Role[]
  },

  async getPermissions() {
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .order('code')

    if (error) throw error
    return data as Permission[]
  },

  async createRole(
    adminId: string,
    name: string,
    description: string,
    permissionIds: string[],
  ) {
    const { data: role, error } = await supabase
      .from('roles')
      .insert({ name, description })
      .select()
      .single()

    if (error) throw error

    if (permissionIds.length > 0) {
      const { error: permError } = await supabase
        .from('role_permissions')
        .insert(
          permissionIds.map((pid) => ({
            role_id: role.id,
            permission_id: pid,
          })),
        )
      if (permError) throw permError
    }

    await this.logAction(adminId, 'CREATE_ROLE', null, {
      role_name: name,
      permission_count: permissionIds.length,
    })

    return role
  },

  async updateRole(
    adminId: string,
    roleId: string,
    name: string,
    description: string,
    permissionIds: string[],
  ) {
    const { error } = await supabase
      .from('roles')
      .update({ name, description })
      .eq('id', roleId)

    if (error) throw error

    await supabase.from('role_permissions').delete().eq('role_id', roleId)

    if (permissionIds.length > 0) {
      const { error: permError } = await supabase
        .from('role_permissions')
        .insert(
          permissionIds.map((pid) => ({ role_id: roleId, permission_id: pid })),
        )
      if (permError) throw permError
    }

    await this.logAction(adminId, 'UPDATE_ROLE_DEF', null, {
      role_id: roleId,
      role_name: name,
    })
  },

  async createGranularPermission(
    adminId: string,
    code: string,
    description: string,
    resourceType: string,
    resourceId: string,
  ) {
    // Check if exists
    const { data: existing } = await supabase
      .from('permissions')
      .select('*')
      .eq('code', code)
      .eq('resource_id', resourceId)
      .single()

    if (existing) return existing

    const { data, error } = await supabase
      .from('permissions')
      .insert({
        code,
        description,
        resource_type: resourceType,
        resource_id: resourceId,
      })
      .select()
      .single()

    if (error) throw error

    await this.logAction(adminId, 'CREATE_PERMISSION', null, {
      code,
      resourceType,
      resourceId,
    })

    return data
  },

  // --- RESOURCES FOR PERMISSIONS ---
  async getProjects() {
    const { data, error } = await supabase
      .from('projects')
      .select('id, nombre, status')
      .order('nombre')
    if (error) throw error
    return data as Partial<Project>[]
  },

  async getClients() {
    const { data, error } = await supabase
      .from('clients')
      .select('id, nombre')
      .order('nombre')
    if (error) throw error
    return data as Partial<Client>[]
  },

  // --- NOTIFICATIONS ---
  async getNotifications(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Notification[]
  },

  async markNotificationRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)

    if (error) throw error
  },

  async markAllNotificationsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)

    if (error) throw error
  },

  // --- EMAIL TEMPLATES ---
  async getEmailTemplates() {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('slug')

    if (error) throw error
    return data as EmailTemplate[]
  },

  async updateEmailTemplate(
    adminId: string,
    id: string,
    subject: string,
    body: string,
  ) {
    const { error } = await supabase
      .from('email_templates')
      .update({ subject, body, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error

    await this.logAction(adminId, 'UPDATE_EMAIL_TEMPLATE', null, {
      template_id: id,
    })
  },

  // --- AUDIT LOGS ---
  async getAuditLogs() {
    const { data, error } = await supabase
      .from('audit_logs')
      .select(
        `
        *,
        admin:admin_id ( email ),
        target:target_user_id ( email )
      `,
      )
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    return data.map((log: any) => ({
      ...log,
      admin_email: log.admin?.email || 'Sistema',
      target_email: log.target?.email || 'N/A',
    })) as AuditLog[]
  },

  async logAction(
    adminId: string,
    actionType: string,
    targetUserId: string | null,
    details: any,
  ) {
    await supabase.from('audit_logs').insert({
      admin_id: adminId,
      action_type: actionType,
      target_user_id: targetUserId,
      details,
    })
  },

  async notifyUser(userId: string, type: string, payload: any) {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('email, nombre')
        .eq('id', userId)
        .single()

      if (!user) return

      await supabase.functions.invoke('notify-user', {
        body: {
          to: user.email,
          name: user.nombre,
          type,
          data: payload,
        },
      })
    } catch (error) {
      console.error('Failed to send notification', error)
    }
  },
}
