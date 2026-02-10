import { supabase } from '@/lib/supabase/client'
import { UserProfile, Role, Permission, AuditLog } from '@/lib/types'

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

  async updateUserStatus(adminId: string, userId: string, newStatus: boolean) {
    // 1. Update user
    const { error } = await supabase
      .from('users')
      .update({ activo: newStatus })
      .eq('id', userId)

    if (error) throw error

    // 2. Log Audit
    await this.logAction(adminId, 'UPDATE_STATUS', userId, {
      new_status: newStatus,
    })

    // 3. Notify User via Edge Function
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
    // 1. Update user
    const { error } = await supabase
      .from('users')
      .update({ role_id: roleId })
      .eq('id', userId)

    if (error) throw error

    // 2. Log Audit
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
          permission_id
        )
      `,
      )
      .order('name')

    if (error) throw error

    // Transform to include permission IDs array
    return data.map((role: any) => ({
      ...role,
      permissions: role.role_permissions.map((rp: any) => ({
        id: rp.permission_id,
      })),
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
    // 1. Create Role
    const { data: role, error } = await supabase
      .from('roles')
      .insert({ name, description })
      .select()
      .single()

    if (error) throw error

    // 2. Assign Permissions
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

    // 3. Log Audit
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
    // 1. Update Role Details
    const { error } = await supabase
      .from('roles')
      .update({ name, description })
      .eq('id', roleId)

    if (error) throw error

    // 2. Update Permissions (Delete all and re-insert)
    await supabase.from('role_permissions').delete().eq('role_id', roleId)

    if (permissionIds.length > 0) {
      const { error: permError } = await supabase
        .from('role_permissions')
        .insert(
          permissionIds.map((pid) => ({ role_id: roleId, permission_id: pid })),
        )
      if (permError) throw permError
    }

    // 3. Log Audit
    await this.logAction(adminId, 'UPDATE_ROLE_DEF', null, {
      role_id: roleId,
      role_name: name,
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

  // --- NOTIFICATIONS ---
  async notifyUser(userId: string, type: 'status_change', payload: any) {
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
