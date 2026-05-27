export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
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
          remarks: string | null;
          qualifications: string | null;
          experience_note: string | null;
          testimonies: Json | null;
          background_check: boolean | null;
          references_shared: boolean | null;
          cv_snapshot: Json | null;
          employer_notes: string | null;
          employer_score: number | null;
          shortlisted_at: string | null;
          rejected_at: string | null;
          hired_at: string | null;
        };
        Insert: {
          applicant_id: string;
          cover_letter?: string | null;
          created_at?: string;
          cv_url?: string | null;
          id?: string;
          job_id: string;
          status?: Database['public']['Enums']['application_status'];
          remarks?: string | null;
          qualifications?: string | null;
          experience_note?: string | null;
          testimonies?: Json | null;
          background_check?: boolean | null;
          references_shared?: boolean | null;
          cv_snapshot?: Json | null;
          employer_notes?: string | null;
          employer_score?: number | null;
          shortlisted_at?: string | null;
          rejected_at?: string | null;
          hired_at?: string | null;
        };
        Update: {
          applicant_id?: string;
          cover_letter?: string | null;
          created_at?: string;
          cv_url?: string | null;
          id?: string;
          job_id?: string;
          status?: Database['public']['Enums']['application_status'];
          remarks?: string | null;
          qualifications?: string | null;
          experience_note?: string | null;
          testimonies?: Json | null;
          background_check?: boolean | null;
          references_shared?: boolean | null;
          cv_snapshot?: Json | null;
          employer_notes?: string | null;
          employer_score?: number | null;
          shortlisted_at?: string | null;
          rejected_at?: string | null;
          hired_at?: string | null;
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
          open_to_work: boolean;
          open_to_work_updated_at: string | null;
          current_company_id: string | null;
          current_job_title: string | null;
          current_department: string | null;
          work_experience: Json | null;
          education_items: Json | null;
          certifications: Json | null;
          references_list: Json | null;
          languages: Json | null;
          nationality: string | null;
          date_of_birth: string | null;
          gender: string | null;
          linkedin_url: string | null;
          github_url: string | null;
          cv_summary: string | null;
          resume_url: string | null;
          portfolio_url: string | null;
          skills: string[] | null;
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
          open_to_work?: boolean;
          open_to_work_updated_at?: string | null;
          current_company_id?: string | null;
          current_job_title?: string | null;
          current_department?: string | null;
          work_experience?: Json | null;
          education_items?: Json | null;
          certifications?: Json | null;
          references_list?: Json | null;
          languages?: Json | null;
          nationality?: string | null;
          date_of_birth?: string | null;
          gender?: string | null;
          linkedin_url?: string | null;
          github_url?: string | null;
          cv_summary?: string | null;
          resume_url?: string | null;
          portfolio_url?: string | null;
          skills?: string[] | null;
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
          open_to_work?: boolean;
          open_to_work_updated_at?: string | null;
          current_company_id?: string | null;
          current_job_title?: string | null;
          current_department?: string | null;
          work_experience?: Json | null;
          education_items?: Json | null;
          certifications?: Json | null;
          references_list?: Json | null;
          languages?: Json | null;
          nationality?: string | null;
          date_of_birth?: string | null;
          gender?: string | null;
          linkedin_url?: string | null;
          github_url?: string | null;
          cv_summary?: string | null;
          resume_url?: string | null;
          portfolio_url?: string | null;
          skills?: string[] | null;
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
      company_employees: {
        Row: {
          id: string;
          user_id: string;
          company_id: string;
          job_title: string;
          department: string | null;
          start_date: string | null;
          is_current: boolean;
          verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_id: string;
          job_title: string;
          department?: string | null;
          start_date?: string | null;
          is_current?: boolean;
          verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_id?: string;
          job_title?: string;
          department?: string | null;
          start_date?: string | null;
          is_current?: boolean;
          verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'company_employees_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      reference_requests: {
        Row: {
          id: string;
          seeker_id: string;
          employee_id: string;
          company_id: string;
          job_title: string | null;
          relationship: string | null;
          message: string | null;
          status: Database['public']['Enums']['reference_status'];
          recommendation: string | null;
          rating: number | null;
          recommender_title: string | null;
          requested_at: string;
          responded_at: string | null;
          completed_at: string | null;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          seeker_id: string;
          employee_id: string;
          company_id: string;
          job_title?: string | null;
          relationship?: string | null;
          message?: string | null;
          status?: Database['public']['Enums']['reference_status'];
          recommendation?: string | null;
          rating?: number | null;
          recommender_title?: string | null;
          requested_at?: string;
          responded_at?: string | null;
          completed_at?: string | null;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          seeker_id?: string;
          employee_id?: string;
          company_id?: string;
          job_title?: string | null;
          relationship?: string | null;
          message?: string | null;
          status?: Database['public']['Enums']['reference_status'];
          recommendation?: string | null;
          rating?: number | null;
          recommender_title?: string | null;
          requested_at?: string;
          responded_at?: string | null;
          completed_at?: string | null;
          expires_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'reference_requests_company_id_fkey';
            columns: ['company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      job_alerts: {
        Row: {
          id: string;
          user_id: string;
          keywords: string[];
          regions: string[];
          industries: string[];
          position_levels: Database['public']['Enums']['position_level'][];
          enabled: boolean;
          email_frequency: string;
          last_sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          keywords?: string[];
          regions?: string[];
          industries?: string[];
          position_levels?: Database['public']['Enums']['position_level'][];
          enabled?: boolean;
          email_frequency?: string;
          last_sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          keywords?: string[];
          regions?: string[];
          industries?: string[];
          position_levels?: Database['public']['Enums']['position_level'][];
          enabled?: boolean;
          email_frequency?: string;
          last_sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          data: Json | null;
          read: boolean;
          read_at: string | null;
          sent_at: string;
          email_sent: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          data?: Json | null;
          read?: boolean;
          read_at?: string | null;
          sent_at?: string;
          email_sent?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          message?: string;
          data?: Json | null;
          read?: boolean;
          read_at?: string | null;
          sent_at?: string;
          email_sent?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      follows: {
        Row: {
          id: string;
          follower_id: string;
          target_user_id: string | null;
          target_company_id: string | null;
          target_type: Database['public']['Enums']['follow_target_type'];
          created_at: string;
        };
        Insert: {
          id?: string;
          follower_id: string;
          target_user_id?: string | null;
          target_company_id?: string | null;
          target_type: Database['public']['Enums']['follow_target_type'];
          created_at?: string;
        };
        Update: {
          id?: string;
          follower_id?: string;
          target_user_id?: string | null;
          target_company_id?: string | null;
          target_type?: Database['public']['Enums']['follow_target_type'];
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'follows_target_company_id_fkey';
            columns: ['target_company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      posts: {
        Row: {
          id: string;
          author_id: string;
          content: string;
          image_url: string | null;
          post_type: string;
          related_job_id: string | null;
          related_company_id: string | null;
          likes_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          author_id: string;
          content: string;
          image_url?: string | null;
          post_type?: string;
          related_job_id?: string | null;
          related_company_id?: string | null;
          likes_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          author_id?: string;
          content?: string;
          image_url?: string | null;
          post_type?: string;
          related_job_id?: string | null;
          related_company_id?: string | null;
          likes_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'posts_related_job_id_fkey';
            columns: ['related_job_id'];
            isOneToOne: false;
            referencedRelation: 'jobs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'posts_related_company_id_fkey';
            columns: ['related_company_id'];
            isOneToOne: false;
            referencedRelation: 'companies';
            referencedColumns: ['id'];
          },
        ];
      };
      post_likes: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          post_id?: string;
          user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'post_likes_post_id_fkey';
            columns: ['post_id'];
            isOneToOne: false;
            referencedRelation: 'posts';
            referencedColumns: ['id'];
          },
        ];
      };
      application_status_history: {
        Row: {
          id: string;
          application_id: string;
          old_status: Database['public']['Enums']['application_status'];
          new_status: Database['public']['Enums']['application_status'];
          changed_by: string | null;
          changed_at: string;
        };
        Insert: {
          id?: string;
          application_id: string;
          old_status: Database['public']['Enums']['application_status'];
          new_status: Database['public']['Enums']['application_status'];
          changed_by?: string | null;
          changed_at?: string;
        };
        Update: {
          id?: string;
          application_id?: string;
          old_status?: Database['public']['Enums']['application_status'];
          new_status?: Database['public']['Enums']['application_status'];
          changed_by?: string | null;
          changed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'application_status_history_application_id_fkey';
            columns: ['application_id'];
            isOneToOne: false;
            referencedRelation: 'applications';
            referencedColumns: ['id'];
          },
        ];
      };
      skills: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          category: string | null;
          difficulty: string;
          quiz_duration_minutes: number | null;
          passing_score: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          category?: string | null;
          difficulty?: string;
          quiz_duration_minutes?: number | null;
          passing_score?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          category?: string | null;
          difficulty?: string;
          quiz_duration_minutes?: number | null;
          passing_score?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      skill_quiz_questions: {
        Row: {
          id: string;
          skill_id: string;
          question_text: string;
          question_type: string;
          options: Json | null;
          correct_answer: string | null;
          explanation: string | null;
          points: number | null;
          order_number: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          skill_id: string;
          question_text: string;
          question_type?: string;
          options?: Json | null;
          correct_answer?: string | null;
          explanation?: string | null;
          points?: number | null;
          order_number?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          skill_id?: string;
          question_text?: string;
          question_type?: string;
          options?: Json | null;
          correct_answer?: string | null;
          explanation?: string | null;
          points?: number | null;
          order_number?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'skill_quiz_questions_skill_id_fkey';
            columns: ['skill_id'];
            isOneToOne: false;
            referencedRelation: 'skills';
            referencedColumns: ['id'];
          },
        ];
      };
      user_skill_assessments: {
        Row: {
          id: string;
          user_id: string;
          skill_id: string;
          started_at: string;
          completed_at: string | null;
          score: number | null;
          passed: boolean | null;
          answers: Json | null;
          time_taken_seconds: number | null;
          status: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          skill_id: string;
          started_at?: string;
          completed_at?: string | null;
          score?: number | null;
          passed?: boolean | null;
          answers?: Json | null;
          time_taken_seconds?: number | null;
          status?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          skill_id?: string;
          started_at?: string;
          completed_at?: string | null;
          score?: number | null;
          passed?: boolean | null;
          answers?: Json | null;
          time_taken_seconds?: number | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_skill_assessments_skill_id_fkey';
            columns: ['skill_id'];
            isOneToOne: false;
            referencedRelation: 'skills';
            referencedColumns: ['id'];
          },
        ];
      };
      user_verified_skills: {
        Row: {
          id: string;
          user_id: string;
          skill_id: string;
          assessment_id: string | null;
          verified_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          skill_id: string;
          assessment_id?: string | null;
          verified_at?: string;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          skill_id?: string;
          assessment_id?: string | null;
          verified_at?: string;
          expires_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_verified_skills_skill_id_fkey';
            columns: ['skill_id'];
            isOneToOne: false;
            referencedRelation: 'skills';
            referencedColumns: ['id'];
          },
        ];
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
      get_follow_counts: {
        Args: {
          p_user_id: string;
        };
        Returns: {
          following_total: number;
          following_seekers: number;
          following_employers: number;
          following_employees: number;
          following_companies: number;
          following_agencies: number;
          followers_total: number;
        };
      };
      get_application_details: {
        Args: {
          p_job_id: string;
          p_poster_id: string;
        };
        Returns: {
          application_id: string;
          applicant_id: string;
          full_name: string | null;
          email: string | null;
          headline: string | null;
          location: string | null;
          skills: string[] | null;
          cv_summary: string | null;
          work_experience: Json | null;
          education_items: Json | null;
          certifications: Json | null;
          references_list: Json | null;
          resume_url: string | null;
          portfolio_url: string | null;
          linkedin_url: string | null;
          remarks: string | null;
          qualifications: string | null;
          experience_note: string | null;
          testimonies: Json | null;
          background_check: boolean | null;
          references_shared: boolean | null;
          cv_snapshot: Json | null;
          employer_notes: string | null;
          employer_score: number | null;
          status: Database['public']['Enums']['application_status'];
          created_at: string;
        };
      };
      get_user_verified_skills: {
        Args: {
          p_user_id: string;
        };
        Returns: {
          skill_id: string;
          skill_name: string;
          verified_at: string;
        };
      };
      user_passed_skill: {
        Args: {
          p_user_id: string;
          p_skill_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: 'job_seeker' | 'employer' | 'admin' | 'employee';
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
      reference_status: 'pending' | 'accepted' | 'completed' | 'declined' | 'withdrawn';
      follow_target_type: 'job_seeker' | 'employer' | 'employee' | 'company' | 'agency';
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
      app_role: ['job_seeker', 'employer', 'admin', 'employee'],
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
      reference_status: ['pending', 'accepted', 'completed', 'declined', 'withdrawn'],
      follow_target_type: ['job_seeker', 'employer', 'employee', 'company', 'agency'],
    },
  },
};
