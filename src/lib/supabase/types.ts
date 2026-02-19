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
          created_at: string
          details: Json | null
          id: string
          target_user_id: string | null
        }
        Insert: {
          action_type: string
          admin_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string | null
          created_at?: string
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
          {
            foreignKeyName: "audit_logs_target_user_id_fkey"
            columns: ["target_user_id"]
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
          created_at: string
          id: string
          nombre: string
          pais: string
        }
        Insert: {
          activo?: boolean | null
          codigo: string
          created_at?: string
          id?: string
          nombre: string
          pais: string
        }
        Update: {
          activo?: boolean | null
          codigo?: string
          created_at?: string
          id?: string
          nombre?: string
          pais?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body: string
          id: string
          slug: string
          subject: string
          updated_at: string
        }
        Insert: {
          body: string
          id?: string
          slug: string
          subject: string
          updated_at?: string
        }
        Update: {
          body?: string
          id?: string
          slug?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string
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
          created_at: string
          description: string | null
          id: string
          resource_id: string | null
          resource_type: string | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          resource_id?: string | null
          resource_type?: string | null
        }
        Update: {
          code?: string
          created_at?: string
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
          client_id: string
          codigo: string
          created_at: string
          gerente_id: string | null
          id: string
          nombre: string
          status: Database["public"]["Enums"]["project_status"] | null
          system_id: string | null
          work_front: string | null
        }
        Insert: {
          client_id: string
          codigo: string
          created_at?: string
          gerente_id?: string | null
          id?: string
          nombre: string
          status?: Database["public"]["Enums"]["project_status"] | null
          system_id?: string | null
          work_front?: string | null
        }
        Update: {
          client_id?: string
          codigo?: string
          created_at?: string
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
          created_at: string
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string
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
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      systems: {
        Row: {
          activo: boolean | null
          codigo: string
          descripcion: string | null
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean | null
          codigo: string
          descripcion?: string | null
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean | null
          codigo?: string
          descripcion?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      time_entries: {
        Row: {
          created_at: string
          description: string | null
          durationminutes: number
          endtime: string
          fecha: string
          id: string
          processed_at: string | null
          processed_by: string | null
          project_id: string
          starttime: string
          status: Database["public"]["Enums"]["time_entry_status"] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          durationminutes: number
          endtime: string
          fecha: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          project_id: string
          starttime: string
          status?: Database["public"]["Enums"]["time_entry_status"] | null
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          durationminutes?: number
          endtime?: string
          fecha?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          project_id?: string
          starttime?: string
          status?: Database["public"]["Enums"]["time_entry_status"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
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
          id: string
          idioma: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          idioma?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          idioma?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          activo: boolean | null
          apellido: string
          created_at: string
          email: string
          id: string
          nombre: string
          role: string | null
          role_id: string
        }
        Insert: {
          activo?: boolean | null
          apellido: string
          created_at?: string
          email: string
          id: string
          nombre: string
          role?: string | null
          role_id: string
        }
        Update: {
          activo?: boolean | null
          apellido?: string
          created_at?: string
          email?: string
          id?: string
          nombre?: string
          role?: string | null
          role_id?: string
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
      user_role: "admin" | "director" | "gerente" | "consultor"
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
      user_role: ["admin", "director", "gerente", "consultor"],
    },
  },
} as const


// ====== DATABASE EXTENDED CONTEXT (auto-generated) ======
// This section contains constraints, RLS policies, functions, triggers,
// indexes and materialized views not present in the type definitions above.

// --- CONSTRAINTS ---
// Table: audit_logs
//   FOREIGN KEY audit_logs_admin_id_fkey: FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
//   PRIMARY KEY audit_logs_pkey: PRIMARY KEY (id)
//   FOREIGN KEY audit_logs_target_user_id_fkey: FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL
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
//   UNIQUE systems_codigo_key: UNIQUE (codigo)
//   PRIMARY KEY systems_pkey: PRIMARY KEY (id)
// Table: time_entries
//   PRIMARY KEY time_entries_pkey: PRIMARY KEY (id)
//   FOREIGN KEY time_entries_processed_by_fkey: FOREIGN KEY (processed_by) REFERENCES users(id)
//   FOREIGN KEY time_entries_project_id_fkey: FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
//   FOREIGN KEY time_entries_user_id_fkey: FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
// Table: user_preferences
//   CHECK user_preferences_idioma_check: CHECK ((idioma = ANY (ARRAY['es'::text, 'pt'::text, 'en'::text])))
//   PRIMARY KEY user_preferences_pkey: PRIMARY KEY (id)
//   FOREIGN KEY user_preferences_user_id_fkey: FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
//   UNIQUE user_preferences_user_id_key: UNIQUE (user_id)
// Table: users
//   UNIQUE users_email_key: UNIQUE (email)
//   FOREIGN KEY users_id_fkey: FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
//   PRIMARY KEY users_pkey: PRIMARY KEY (id)
//   CHECK users_role_check: CHECK ((role = ANY (ARRAY['admin'::text, 'director'::text, 'gerente'::text, 'consultor'::text])))
//   FOREIGN KEY users_role_id_fkey: FOREIGN KEY (role_id) REFERENCES roles(id)

// --- ROW LEVEL SECURITY POLICIES ---
// Table: audit_logs
//   Policy "Insert audit logs" (INSERT, PERMISSIVE) roles={authenticated}
//     WITH CHECK: true
//   Policy "View audit logs" (SELECT, PERMISSIVE) roles={public}
//     USING: (get_current_user_role() = ANY (ARRAY['admin'::text, 'director'::text]))
// Table: clients
//   Policy "Read clients" (SELECT, PERMISSIVE) roles={public}
//     USING: (auth.role() = 'authenticated'::text)
// Table: email_templates
//   Policy "Admins can manage email templates" (ALL, PERMISSIVE) roles={public}
//     USING: (get_current_user_role() = 'admin'::text)
//   Policy "Service role can read templates" (SELECT, PERMISSIVE) roles={service_role}
//     USING: true
// Table: notifications
//   Policy "Admins can manage all notifications" (ALL, PERMISSIVE) roles={public}
//     USING: (get_current_user_role() = 'admin'::text)
//   Policy "Users can view their own notifications" (SELECT, PERMISSIVE) roles={public}
//     USING: (auth.uid() = user_id)
// Table: permissions
//   Policy "Read permissions" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
// Table: project_assignments
//   Policy "Manage assignments" (ALL, PERMISSIVE) roles={public}
//     USING: (get_current_user_role() = ANY (ARRAY['admin'::text, 'director'::text, 'gerente'::text]))
//   Policy "View own assignments" (SELECT, PERMISSIVE) roles={public}
//     USING: (user_id = auth.uid())
// Table: projects
//   Policy "Admin/Director manage projects" (ALL, PERMISSIVE) roles={public}
//     USING: (get_current_user_role() = ANY (ARRAY['admin'::text, 'director'::text]))
//   Policy "Anon read projects" (SELECT, PERMISSIVE) roles={anon,authenticated}
//     USING: true
//   Policy "Consultor view assigned projects" (SELECT, PERMISSIVE) roles={public}
//     USING: (id IN ( SELECT project_assignments.project_id
   FROM project_assignments
  WHERE (project_assignments.user_id = auth.uid())))
//   Policy "Gerente view managed projects" (SELECT, PERMISSIVE) roles={public}
//     USING: (gerente_id = auth.uid())
// Table: role_permissions
//   Policy "Manage role_permissions" (ALL, PERMISSIVE) roles={public}
//     USING: (get_current_user_role() = 'admin'::text)
//   Policy "Read role_permissions" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
// Table: roles
//   Policy "Manage roles" (ALL, PERMISSIVE) roles={public}
//     USING: (get_current_user_role() = 'admin'::text)
//   Policy "Read roles" (SELECT, PERMISSIVE) roles={authenticated}
//     USING: true
// Table: systems
//   Policy "Read systems" (SELECT, PERMISSIVE) roles={public}
//     USING: (auth.role() = 'authenticated'::text)
// Table: time_entries
//   Policy "Admin/Director manage time entries" (ALL, PERMISSIVE) roles={public}
//     USING: (get_current_user_role() = ANY (ARRAY['admin'::text, 'director'::text]))
//   Policy "Gerente view project entries" (SELECT, PERMISSIVE) roles={public}
//     USING: (project_id IN ( SELECT projects.id
   FROM projects
  WHERE (projects.gerente_id = auth.uid())))
//   Policy "Users manage own entries" (ALL, PERMISSIVE) roles={public}
//     USING: (user_id = auth.uid())
// Table: user_preferences
//   Policy "Users can insert their own preferences" (INSERT, PERMISSIVE) roles={public}
//     WITH CHECK: (auth.uid() = user_id)
//   Policy "Users can update their own preferences" (UPDATE, PERMISSIVE) roles={public}
//     USING: (auth.uid() = user_id)
//   Policy "Users can view their own preferences" (SELECT, PERMISSIVE) roles={public}
//     USING: (auth.uid() = user_id)
// Table: users
//   Policy "Admin and Director view all users" (SELECT, PERMISSIVE) roles={public}
//     USING: (get_current_user_role() = ANY (ARRAY['admin'::text, 'director'::text]))
//   Policy "Users view own profile" (SELECT, PERMISSIVE) roles={public}
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
//     _role_name TEXT;
//   BEGIN
//     -- Join with roles table to get the role name via role_id
//     SELECT r.name INTO _role_name
//     FROM public.users u
//     JOIN public.roles r ON u.role_id = r.id
//     WHERE u.id = auth.uid();
//     
//     RETURN _role_name;
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
//     target_role_id UUID;
//     raw_role TEXT;
//     raw_project_id TEXT;
//     proj_id UUID;
//   BEGIN
//     raw_role := NEW.raw_user_meta_data->>'role';
//     
//     -- Find role by name or default to consultor
//     SELECT id INTO target_role_id FROM public.roles WHERE name = raw_role;
//     
//     IF target_role_id IS NULL THEN
//       SELECT id INTO target_role_id FROM public.roles WHERE name = 'consultor';
//     END IF;
//   
//     INSERT INTO public.users (id, email, nombre, apellido, role_id)
//     VALUES (
//       NEW.id,
//       NEW.email,
//       COALESCE(NEW.raw_user_meta_data->>'nombre', 'Usuario'),
//       COALESCE(NEW.raw_user_meta_data->>'apellido', 'Nuevo'),
//       target_role_id
//     )
//     ON CONFLICT (id) DO UPDATE SET
//       email = EXCLUDED.email,
//       nombre = EXCLUDED.nombre,
//       apellido = EXCLUDED.apellido,
//       role_id = EXCLUDED.role_id,
//       activo = TRUE;
//   
//     -- Handle Project Assignment
//     raw_project_id := NEW.raw_user_meta_data->>'projectId';
//     
//     IF (SELECT name FROM public.roles WHERE id = target_role_id) = 'consultor' AND raw_project_id IS NOT NULL AND raw_project_id <> '' THEN
//        BEGIN
//          proj_id := raw_project_id::UUID;
//          IF proj_id IS NOT NULL THEN
//            INSERT INTO public.project_assignments (project_id, user_id)
//            VALUES (proj_id, NEW.id)
//            ON CONFLICT (project_id, user_id) DO NOTHING;
//          END IF;
//        EXCEPTION WHEN OTHERS THEN
//          -- Log error but don't fail transaction
//          RAISE WARNING 'Invalid project ID % for user %', raw_project_id, NEW.id;
//        END;
//     END IF;
//   
//     RETURN NEW;
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
//   CREATE UNIQUE INDEX permissions_code_resource_idx ON public.permissions USING btree (code, ((resource_id IS NULL))) WHERE (resource_id IS NULL)
//   CREATE UNIQUE INDEX permissions_code_resource_val_idx ON public.permissions USING btree (code, resource_id) WHERE (resource_id IS NOT NULL)
// Table: project_assignments
//   CREATE UNIQUE INDEX project_assignments_project_id_user_id_key ON public.project_assignments USING btree (project_id, user_id)
// Table: projects
//   CREATE UNIQUE INDEX projects_codigo_key ON public.projects USING btree (codigo)
// Table: roles
//   CREATE UNIQUE INDEX roles_name_key ON public.roles USING btree (name)
// Table: systems
//   CREATE UNIQUE INDEX systems_codigo_key ON public.systems USING btree (codigo)
// Table: time_entries
//   CREATE INDEX time_entries_processed_by_idx ON public.time_entries USING btree (processed_by)
//   CREATE INDEX time_entries_status_date_idx ON public.time_entries USING btree (status, fecha)
// Table: user_preferences
//   CREATE UNIQUE INDEX user_preferences_user_id_key ON public.user_preferences USING btree (user_id)
// Table: users
//   CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email)

