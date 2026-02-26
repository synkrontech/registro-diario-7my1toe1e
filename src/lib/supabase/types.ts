// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action_type: string
          admin_id: string | null
          created_at: string | null
          details: Json | null
          id: string
          target_user_id: string | null
        }
        Insert: {
          action_type: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string | null
          created_at?: string | null
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          activo: boolean | null
          codigo: string
          created_at: string | null
          email: string | null
          id: string
          nombre: string
          pais: string | null
        }
        Insert: {
          activo?: boolean | null
          codigo: string
          created_at?: string | null
          email?: string | null
          id?: string
          nombre: string
          pais?: string | null
        }
        Update: {
          activo?: boolean | null
          codigo?: string
          created_at?: string | null
          email?: string | null
          id?: string
          nombre?: string
          pais?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body: string
          id: string
          slug: string
          subject: string
          updated_at: string | null
        }
        Insert: {
          body: string
          id?: string
          slug: string
          subject: string
          updated_at?: string | null
        }
        Update: {
          body?: string
          id?: string
          slug?: string
          subject?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          title: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          title?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          code: string
          description: string | null
          id: string
          resource_id: string | null
          resource_type: string | null
        }
        Insert: {
          code: string
          description?: string | null
          id?: string
          resource_id?: string | null
          resource_type?: string | null
        }
        Update: {
          code?: string
          description?: string | null
          id?: string
          resource_id?: string | null
          resource_type?: string | null
        }
        Relationships: []
      }
      project_assignments: {
        Row: {
          id: string
          project_id: string
          user_id: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_assignments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client_id: string | null
          codigo: string | null
          created_at: string | null
          gerente_id: string | null
          id: string
          nombre: string
          status: Database["public"]["Enums"]["project_status"] | null
          system_id: string | null
          work_front: string | null
        }
        Insert: {
          client_id?: string | null
          codigo?: string | null
          created_at?: string | null
          gerente_id?: string | null
          id?: string
          nombre: string
          status?: Database["public"]["Enums"]["project_status"] | null
          system_id?: string | null
          work_front?: string | null
        }
        Update: {
          client_id?: string | null
          codigo?: string | null
          created_at?: string | null
          gerente_id?: string | null
          id?: string
          nombre?: string
          status?: Database["public"]["Enums"]["project_status"] | null
          system_id?: string | null
          work_front?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_gerente_id_fkey"
            columns: ["gerente_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          permission_id: string
          role_id: string
        }
        Insert: {
          permission_id: string
          role_id: string
        }
        Update: {
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          description: string | null
          id: string
          name: string
        }
        Insert: {
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      systems: {
        Row: {
          activo: boolean | null
          client_id: string | null
          codigo: string | null
          created_at: string | null
          descripcion: string | null
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean | null
          client_id?: string | null
          codigo?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean | null
          client_id?: string | null
          codigo?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "systems_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          created_at: string | null
          description: string | null
          durationminutes: number
          end_time: string | null
          endtime: string
          fecha: string
          id: string
          project_id: string
          rejection_reason: string | null
          start_time: string | null
          starttime: string
          status: Database["public"]["Enums"]["time_entry_status"] | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          durationminutes: number
          end_time?: string | null
          endtime: string
          fecha: string
          id?: string
          project_id: string
          rejection_reason?: string | null
          start_time?: string | null
          starttime: string
          status?: Database["public"]["Enums"]["time_entry_status"] | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          durationminutes?: number
          end_time?: string | null
          endtime?: string
          fecha?: string
          id?: string
          project_id?: string
          rejection_reason?: string | null
          start_time?: string | null
          starttime?: string
          status?: Database["public"]["Enums"]["time_entry_status"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string | null
          idioma: string | null
          settings: Json | null
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          idioma?: string | null
          settings?: Json | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          idioma?: string | null
          settings?: Json | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          activo: boolean | null
          apellido: string
          created_at: string | null
          email: string
          id: string
          nombre: string
          role_id: string | null
        }
        Insert: {
          activo?: boolean | null
          apellido: string
          created_at?: string | null
          email: string
          id: string
          nombre: string
          role_id?: string | null
        }
        Update: {
          activo?: boolean | null
          apellido?: string
          created_at?: string | null
          email?: string
          id?: string
          nombre?: string
          role_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: { Args: never; Returns: string }
    }
    Enums: {
      project_status: "activo" | "pausado" | "finalizado"
      time_entry_status: "pendiente" | "aprobado" | "rechazado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      project_status: ["activo", "pausado", "finalizado"],
      time_entry_status: ["pendiente", "aprobado", "rechazado"],
    },
  },
} as const


// ====== DATABASE EXTENDED CONTEXT (auto-generated) ======
// This section contains actual PostgreSQL column types, constraints, RLS policies,
// functions, triggers, indexes and materialized views not present in the type definitions above.
// IMPORTANT: The TypeScript types above map UUID, TEXT, VARCHAR all to "string".
// Use the COLUMN TYPES section below to know the real PostgreSQL type for each column.
// Always use the correct PostgreSQL type when writing SQL migrations.

// --- COLUMN TYPES (actual PostgreSQL types) ---
// Use this to know the real database type when writing migrations.
// "string" in TypeScript types above may be uuid, text, varchar, timestamptz, etc.
// Table: audit_logs
//   id: uuid (not null, default: gen_random_uuid())
//   admin_id: uuid (nullable)
//   action_type: text (not null)
//   target_user_id: uuid (nullable)
//   details: jsonb (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: clients
//   id: uuid (not null, default: gen_random_uuid())
//   nombre: text (not null)
//   codigo: text (not null)
//   pais: text (nullable)
//   email: text (nullable)
//   activo: boolean (nullable, default: true)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: email_templates
//   id: uuid (not null, default: gen_random_uuid())
//   slug: text (not null)
//   subject: text (not null)
//   body: text (not null)
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: notifications
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (nullable)
//   title: text (nullable)
//   message: text (not null)
//   type: text (nullable)
//   is_read: boolean (nullable, default: false)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: permissions
//   id: uuid (not null, default: gen_random_uuid())
//   code: text (not null)
//   description: text (nullable)
//   resource_id: uuid (nullable)
//   resource_type: text (nullable)
// Table: project_assignments
//   id: uuid (not null, default: gen_random_uuid())
//   project_id: uuid (not null)
//   user_id: uuid (not null)
// Table: projects
//   id: uuid (not null, default: gen_random_uuid())
//   nombre: text (not null)
//   codigo: text (nullable)
//   status: project_status (nullable, default: 'activo'::project_status)
//   client_id: uuid (nullable)
//   system_id: uuid (nullable)
//   gerente_id: uuid (nullable)
//   work_front: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: role_permissions
//   role_id: uuid (not null)
//   permission_id: uuid (not null)
// Table: roles
//   id: uuid (not null, default: gen_random_uuid())
//   name: text (not null)
//   description: text (nullable)
// Table: systems
//   id: uuid (not null, default: gen_random_uuid())
//   nombre: text (not null)
//   descripcion: text (nullable)
//   codigo: text (nullable)
//   client_id: uuid (nullable)
//   activo: boolean (nullable, default: true)
//   created_at: timestamp with time zone (nullable, default: now())
// Table: time_entries
//   id: uuid (not null, default: gen_random_uuid())
//   user_id: uuid (not null)
//   project_id: uuid (not null)
//   fecha: date (not null)
//   starttime: text (not null)
//   endtime: text (not null)
//   durationminutes: integer (not null)
//   description: text (nullable)
//   status: time_entry_status (nullable, default: 'pendiente'::time_entry_status)
//   rejection_reason: text (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   start_time: timestamp with time zone (nullable)
//   end_time: timestamp with time zone (nullable)
// Table: user_preferences
//   user_id: uuid (not null)
//   idioma: text (nullable)
//   timezone: text (nullable)
//   settings: jsonb (nullable)
//   created_at: timestamp with time zone (nullable, default: now())
//   updated_at: timestamp with time zone (nullable, default: now())
// Table: users
//   id: uuid (not null)
//   email: text (not null)
//   nombre: text (not null)
//   apellido: text (not null)
//   activo: boolean (nullable, default: true)
//   created_at: timestamp with time zone (nullable, default: now())
//   role_id: uuid (nullable)

// --- CONSTRAINTS ---
// Table: audit_logs
//   FOREIGN KEY audit_logs_admin_id_fkey: FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
//   PRIMARY KEY audit_logs_pkey: PRIMARY KEY (id)
// Table: clients
//   UNIQUE clients_codigo_key: UNIQUE (codigo)
//   PRIMARY KEY clients_pkey: PRIMARY KEY (id)
// Table: email_templates
//   PRIMARY KEY email_templates_pkey: PRIMARY KEY (id)
//   UNIQUE email_templates_slug_key: UNIQUE (slug)
// Table: notifications
//   PRIMARY KEY notifications_pkey: PRIMARY KEY (id)
//   FOREIGN KEY notifications_user_id_fkey: FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
// Table: permissions
//   PRIMARY KEY permissions_pkey: PRIMARY KEY (id)
// Table: project_assignments
//   PRIMARY KEY project_assignments_pkey: PRIMARY KEY (id)
//   FOREIGN KEY project_assignments_project_id_fkey: FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
//   UNIQUE project_assignments_project_id_user_id_key: UNIQUE (project_id, user_id)
//   FOREIGN KEY project_assignments_user_id_fkey: FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
// Table: projects
//   FOREIGN KEY projects_client_id_fkey: FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
//   UNIQUE projects_codigo_key: UNIQUE (codigo)
//   FOREIGN KEY projects_gerente_id_fkey: FOREIGN KEY (gerente_id) REFERENCES users(id) ON DELETE SET NULL
//   PRIMARY KEY projects_pkey: PRIMARY KEY (id)
//   FOREIGN KEY projects_system_id_fkey: FOREIGN KEY (system_id) REFERENCES systems(id) ON DELETE SET NULL
// Table: role_permissions
//   FOREIGN KEY role_permissions_permission_id_fkey: FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
//   PRIMARY KEY role_permissions_pkey: PRIMARY KEY (role_id, permission_id)
//   FOREIGN KEY role_permissions_role_id_fkey: FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
// Table: roles
//   UNIQUE roles_name_key: UNIQUE (name)
//   PRIMARY KEY roles_pkey: PRIMARY KEY (id)
// Table: systems
//   FOREIGN KEY systems_client_id_fkey: FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
//   UNIQUE systems_codigo_key: UNIQUE (codigo)
//   PRIMARY KEY systems_pkey: PRIMARY KEY (id)
// Table: time_entries
//   PRIMARY KEY time_entries_pkey: PRIMARY KEY (id)
//   FOREIGN KEY time_entries_project_id_fkey: FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
//   FOREIGN KEY time_entries_user_id_fkey: FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
// Table: user_preferences
//   PRIMARY KEY user_preferences_pkey: PRIMARY KEY (user_id)
//   FOREIGN KEY user_preferences_user_id_fkey: FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
// Table: users
//   UNIQUE users_email_key: UNIQUE (email)
//   FOREIGN KEY users_id_fkey: FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
//   PRIMARY KEY users_pkey: PRIMARY KEY (id)
//   FOREIGN KEY users_role_id_fkey: FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE SET NULL

// --- ROW LEVEL SECURITY POLICIES ---
// Table: audit_logs
//   Policy "Admin manage audit_logs" (ALL, PERMISSIVE) roles={public}
//     USING: (get_current_user_role() = 'admin'::text)
// Table: clients
//   Policy "Admin manage clients" (ALL, PERMISSIVE) roles={public}
//     USING: (get_current_user_role() = ANY (ARRAY['admin'::text, 'director'::text]))
//   Policy "Auth read clients" (SELECT, PERMISSIVE) roles={public}
//     USING: (auth.role() = 'authenticated'::text)
// Table: email_templates
//   Policy "Admin manage email_templates" (ALL, PERMISSIVE) roles={public}
//     USING: (get_current_user_role() = 'admin'::text)
//   Policy "Auth read email_templates" (SELECT, PERMISSIVE) roles={public}
//     USING: (auth.role() = 'authenticated'::text)
// Table: notifications
//   Policy "Admin manage all notifications" (ALL, PERMISSIVE) roles={public}
//     USING: (get_current_user_role() = 'admin'::text)
//   Policy "Users manage own notifications" (ALL, PERMISSIVE) roles={public}
//     USING: (user_id = auth.uid())
// Table: permissions
//   Policy "Auth read permissions" (SELECT, PERMISSIVE) roles={public}
//     USING: (auth.role() = 'authenticated'::text)
// Table: project_assignments
//   Policy "Admin manage assignments" (ALL, PERMISSIVE) roles={public}
//     USING: (get_current_user_role() = ANY (ARRAY['admin'::text, 'director'::text, 'gerente'::text]))
//   Policy "Users read own assignments" (SELECT, PERMISSIVE) roles={public}
//     USING: (user_id = auth.uid())
// Table: projects
//   Policy "Admin manage projects" (ALL, PERMISSIVE) roles={public}
//     USING: (get_current_user_role() = ANY (ARRAY['admin'::text, 'director'::text]))
//   Policy "Anon read projects" (SELECT, PERMISSIVE) roles={anon}
//     USING: true
//   Policy "Consultor read assigned projects" (SELECT, PERMISSIVE) roles={public}
//     USING: ((id IN ( SELECT project_assignments.project_id
//               FROM project_assignments
//              WHERE (project_assignments.user_id = auth.uid()))) OR (get_current_user_role() = ANY (ARRAY['admin'::text, 'director'::text, 'gerente'::text])))
// Table: role_permissions
//   Policy "Auth read role_permissions" (SELECT, PERMISSIVE) roles={public}
//     USING: (auth.role() = 'authenticated'::text)
// Table: roles
//   Policy "Auth read roles" (SELECT, PERMISSIVE) roles={public}
//     USING: (auth.role() = 'authenticated'::text)
// Table: systems
//   Policy "Admin manage systems" (ALL, PERMISSIVE) roles={public}
//     USING: (get_current_user_role() = ANY (ARRAY['admin'::text, 'director'::text]))
//   Policy "Auth read systems" (SELECT, PERMISSIVE) roles={public}
//     USING: (auth.role() = 'authenticated'::text)
// Table: time_entries
//   Policy "Admin manage all entries" (ALL, PERMISSIVE) roles={public}
//     USING: (get_current_user_role() = ANY (ARRAY['admin'::text, 'director'::text]))
//   Policy "Gerente read managed project entries" (SELECT, PERMISSIVE) roles={public}
//     USING: (project_id IN ( SELECT projects.id
//               FROM projects
//              WHERE (projects.gerente_id = auth.uid())))
//   Policy "Users manage own entries" (ALL, PERMISSIVE) roles={public}
//     USING: (user_id = auth.uid())
// Table: user_preferences
//   Policy "Users manage own preferences" (ALL, PERMISSIVE) roles={public}
//     USING: (user_id = auth.uid())
// Table: users
//   Policy "Admins manage all users" (ALL, PERMISSIVE) roles={public}
//     USING: (get_current_user_role() = ANY (ARRAY['admin'::text, 'director'::text]))
//   Policy "Users read own profile" (SELECT, PERMISSIVE) roles={public}
//     USING: (auth.uid() = id)

// --- DATABASE FUNCTIONS ---
// FUNCTION get_current_user_role()
//   CREATE OR REPLACE FUNCTION public.get_current_user_role()
//    RETURNS text
//    LANGUAGE plpgsql
//    STABLE SECURITY DEFINER
//    SET search_path TO 'public'
//   AS $function$
//   DECLARE
//       _role_name TEXT;
//   BEGIN
//       SELECT r.name INTO _role_name
//       FROM public.users u
//       JOIN public.roles r ON u.role_id = r.id
//       WHERE u.id = auth.uid();
//       
//       -- Fallback to old enum column if relation fails
//       IF _role_name IS NULL THEN
//           SELECT role::text INTO _role_name FROM public.users WHERE id = auth.uid();
//       END IF;
//   
//       RETURN _role_name;
//   END;
//   $function$
//   
// FUNCTION handle_new_user()
//   CREATE OR REPLACE FUNCTION public.handle_new_user()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//    SET search_path TO 'public'
//   AS $function$
//   DECLARE
//       _role_name TEXT;
//       _role_id UUID;
//   BEGIN
//       _role_name := NEW.raw_user_meta_data->>'role';
//       IF _role_name IS NULL OR _role_name = '' THEN
//           _role_name := 'consultor';
//       END IF;
//   
//       SELECT id INTO _role_id FROM public.roles WHERE name = _role_name LIMIT 1;
//       IF _role_id IS NULL THEN
//           SELECT id INTO _role_id FROM public.roles WHERE name = 'consultor' LIMIT 1;
//       END IF;
//   
//       BEGIN
//           INSERT INTO public.users (id, email, nombre, apellido, role_id, activo)
//           VALUES (
//               NEW.id,
//               NEW.email,
//               COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario'),
//               COALESCE(NEW.raw_user_meta_data->>'apellido', 'Nuevo'),
//               _role_id,
//               TRUE
//           )
//           ON CONFLICT (id) DO UPDATE SET
//               email = EXCLUDED.email,
//               nombre = EXCLUDED.nombre,
//               apellido = EXCLUDED.apellido,
//               role_id = EXCLUDED.role_id,
//               activo = EXCLUDED.activo;
//       EXCEPTION WHEN OTHERS THEN
//           -- Fallback for older schema compatibilities
//           INSERT INTO public.users (id, email, nombre, apellido, role, role_id, activo)
//           VALUES (
//               NEW.id,
//               NEW.email,
//               COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario'),
//               COALESCE(NEW.raw_user_meta_data->>'apellido', 'Nuevo'),
//               'consultor'::public.user_role,
//               _role_id,
//               TRUE
//           )
//           ON CONFLICT (id) DO UPDATE SET
//               email = EXCLUDED.email,
//               nombre = EXCLUDED.nombre,
//               apellido = EXCLUDED.apellido,
//               role_id = EXCLUDED.role_id,
//               activo = EXCLUDED.activo;
//       END;
//   
//       RETURN NEW;
//   END;
//   $function$
//   
// FUNCTION notify_admins_on_event()
//   CREATE OR REPLACE FUNCTION public.notify_admins_on_event()
//    RETURNS trigger
//    LANGUAGE plpgsql
//    SECURITY DEFINER
//   AS $function$
//   DECLARE
//       admin_record RECORD;
//   BEGIN
//       FOR admin_record IN 
//           SELECT u.id FROM public.users u
//           JOIN public.roles r ON u.role_id = r.id
//           WHERE r.name = 'admin' AND u.activo = true
//       LOOP
//           INSERT INTO public.notifications (user_id, title, message, type)
//           VALUES (
//               admin_record.id, 
//               TG_ARGV[0], 
//               format(TG_ARGV[1], COALESCE(NEW.email, 'Desconocido')), 
//               TG_ARGV[2]
//           );
//       END LOOP;
//       RETURN NEW;
//   END;
//   $function$
//   

// --- TRIGGERS ---
// Table: audit_logs
//   on_audit_log_notify_admin: CREATE TRIGGER on_audit_log_notify_admin AFTER INSERT ON public.audit_logs FOR EACH ROW EXECUTE FUNCTION notify_admins_on_event('Alerta de Auditoría', 'Nueva acción registrada: %s', 'audit')
// Table: users
//   on_new_user_notify_admin: CREATE TRIGGER on_new_user_notify_admin AFTER INSERT ON public.users FOR EACH ROW EXECUTE FUNCTION notify_admins_on_event('Nuevo Usuario', 'El usuario %s se ha registrado.', 'registration')

// --- INDEXES ---
// Table: clients
//   CREATE UNIQUE INDEX clients_codigo_key ON public.clients USING btree (codigo)
// Table: email_templates
//   CREATE UNIQUE INDEX email_templates_slug_key ON public.email_templates USING btree (slug)
// Table: permissions
//   CREATE UNIQUE INDEX permissions_code_idx ON public.permissions USING btree (code) WHERE (resource_id IS NULL)
//   CREATE UNIQUE INDEX permissions_code_resource_idx ON public.permissions USING btree (code, resource_id) WHERE (resource_id IS NOT NULL)
// Table: project_assignments
//   CREATE UNIQUE INDEX project_assignments_project_id_user_id_key ON public.project_assignments USING btree (project_id, user_id)
// Table: projects
//   CREATE UNIQUE INDEX projects_codigo_key ON public.projects USING btree (codigo)
// Table: roles
//   CREATE UNIQUE INDEX roles_name_key ON public.roles USING btree (name)
// Table: systems
//   CREATE UNIQUE INDEX systems_codigo_key ON public.systems USING btree (codigo)
// Table: users
//   CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email)

