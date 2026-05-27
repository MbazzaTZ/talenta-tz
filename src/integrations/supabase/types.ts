export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  public: {
    Tables: {
      applications: {
        Row: {
          applicant_id: string;
          cover_letter: string | null;
          created_at: string;
          cv_url: string | null;
          id: string;
          job_id: string;
          status: Database['public']['Enums']['application_status'];
        };
        Insert: {
          applicant_id: string;
          cover_letter?: string | null;
          created_at?: string;
          cv_url?: string | null;
          id?: string;
          job_id: string;
          status?: Database['public']['Enums']['application_status'];
        };
        Update: {
          applicant_id?: string;
          cover_letter?: string | null;
          created_at?: string;
          cv_url?: string | null;
          id?: string;
          job_id?: string;
          status?: Database['public']['Enums']['application_status'];
        };
        Relationships: [
          {
            foreignKeyName: 'applications_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs';
            referencedColumns: ['id'];
          },
        ];
      };
      companies: {
        Row: {
          banner_url: string | null;
          created_at: string;
          description: string | null;
          employees_count: string | null;
          id: string;
          industry: string | null;
          location: string | null;
          logo_url: string | null;
          name: string;
          owner_id: string;
          premium: boolean;
          slug: string | null;
          suspended: boolean;
          verified: boolean;
          website: string | null;
        };
        Insert: {
          banner_url?: string | null;
          created_at?: string;
          description?: string | null;
          employees_count?: string | null;
          id?: string;
          industry?: string | null;
          location?: string | null;
          logo_url?: string | null;
          name: string;
          owner_id: string;
          premium?: boolean;
          slug?: string | null;
          suspended?: boolean;
          verified?: boolean;
          website?: string | null;
        };
        Update: {
          banner_url?: string | null;
          created_at?: string;
          description?: string | null;
          employees_count?: string | null;
          id?: string;
          industry?: string | null;
          location?: string | null;
          logo_url?: string | null;
          name?: string;
          owner_id?: string;
          premium?: boolean;
          slug?: string | null;
          suspended?: boolean;
          verified?: boolean;
          website?: string | null;
        };
        Relationships: [];
      };
      jobs: {
        Row: {
          company_id: string;
          contract_type: Database['public']['Enums']['contract_type'];
          created_at: string;
          created_by_role: Database['public']['Enums']['app_role'];
          currency: string | null;
          deadline: string | null;
          description: string;
          featured: boolean;
          id: string;
          industry: string;
          location: string;
          position_level: Database['public']['Enums']['position_level'];
          posted_by: string;
          qualification: Database['public']['Enums']['qualification_level'] | null;
          region: string | null;
          salary_max: number | null;
          salary_min: number | null;
          salary_negotiable: boolean | null;
          status: Database['public']['Enums']['job_status'];
          title: string;
          views_count: number;
        };
        Insert: {
          company_id: string;
          contract_type: Database['public']['Enums']['contract_type'];
          created_at?: string;
          created_by_role?: Database['public']['Enums']['app_role'];
          currency?: string | null;
          deadline?: string | null;
          description: string;
          featured?: boolean;
          id?: string;
          industry: string;
          location: string;
          position_level: Database['public']['Enums']['position_level'];
          posted_by: string;
          qualification?: Database['public']['Enums']['qualification_level'] | null;
          region?: string | null;
          salary_max?: number | null;
          salary_min?: number | null;
          salary_negotiable?: boolean | null;
          status?: Database['public']['Enums']['job_status'];
          title: string;
          views_count?: number;
        };
        Update: {
          company_id?: string;
          contract_type?: Database['public']['Enums']['contract_type'];
          created_at?: string;
          created_by_role?: Database['public']['Enums']['app_role'];
          currency?: string | null;
          deadline?: string | null;
          description?: string;
          featured?: boolean;
          id?: string;
          industry?: string;
          location?: string;
          position_level?: Database['public']['Enums']['position_level'];
          posted_by?: string;
          qualification?: Database['public']['Enums']['qualification_level'] | null;
          region?: string | null;
          salary_max?: number | null;
          salary_min?: number | null;
          salary_negotiable?: boolean | null;
          status?: Database['public']['Enums']['job_status'];
          title?: string;
          views_count?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'jobs_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          full_name: string | null;
          headline: string | null;
          id: string;
          language: string | null;
          location: string | null;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          full_name?: string | null;
          headline?: string | null;
          id: string;
          language?: string | null;
          location?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          full_name?: string | null;
          headline?: string | null;
          id?: string;
          language?: string | null;
          location?: string | null;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      saved_jobs: {
        Row: {
          created_at: string;
          id: string;
          job_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          job_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          job_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'saved_jobs_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs';
            referencedColumns: ['id'];
          },
        ];
      };
      job_reports: {
        Row: {
          created_at: string;
          details: string | null;
          id: string;
          job_id: string;
          reporter_id: string;
          reason: string;
          status: Database['public']['Enums']['report_status'];
        };
        Insert: {
          created_at?: string;
          details?: string | null;
          id?: string;
          job_id: string;
          reporter_id: string;
          reason: string;
          status?: Database['public']['Enums']['report_status'];
        };
        Update: {
          created_at?: string;
          details?: string | null;
          id?: string;
          job_id?: string;
          reporter_id?: string;
          reason?: string;
          status?: Database['public']['Enums']['report_status'];
        };
        Relationships: [
          {
            foreignKeyName: 'job_reports_job_id_fkey';
            columns: ['job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs';
            referencedColumns: ['id'];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database['public']['Enums']['app_role'];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database['public']['Enums']['app_role'];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database['public']['Enums']['app_role'];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database['public']['Enums']['app_role'];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: 'job_seeker' | 'employer' | 'admin';
      application_status:
        | 'applied'
        | 'under_review'
        | 'shortlisted'
        | 'interview'
        | 'offer'
        | 'hired'
        | 'rejected';
      report_status: 'open' | 'reviewed' | 'dismissed';
      contract_type:
        | 'permanent'
        | 'contract'
        | 'temporary'
        | 'freelance'
        | 'internship'
        | 'volunteer'
        | 'consultancy';
      job_status: 'draft' | 'published' | 'closed';
      position_level:
        | 'intern'
        | 'graduate_trainee'
        | 'entry'
        | 'mid'
        | 'senior'
        | 'manager'
        | 'director'
        | 'executive';
      qualification_level:
        | 'certificate'
        | 'diploma'
        | 'bachelors'
        | 'masters'
        | 'phd'
        | 'professional';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ['job_seeker', 'employer', 'admin'],
      application_status: [
        'applied',
        'under_review',
        'shortlisted',
        'interview',
        'offer',
        'hired',
        'rejected',
      ],
      report_status: ['open', 'reviewed', 'dismissed'],
      contract_type: [
        'permanent',
        'contract',
        'temporary',
        'freelance',
        'internship',
        'volunteer',
        'consultancy',
      ],
      job_status: ['draft', 'published', 'closed'],
      position_level: [
        'intern',
        'graduate_trainee',
        'entry',
        'mid',
        'senior',
        'manager',
        'director',
        'executive',
      ],
      qualification_level: [
        'certificate',
        'diploma',
        'bachelors',
        'masters',
        'phd',
        'professional',
      ],
    },
  },
} as const;
