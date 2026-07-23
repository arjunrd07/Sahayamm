export type UserRole = "customer" | "admin";
export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected";
export type LoanStatus = "pending" | "approved" | "rejected" | "active" | "completed" | "overdue";
export type AgreementStatus = "draft" | "sent" | "partially_signed" | "completed";
export type NotificationType =
  | "verification_decision"
  | "loan_requested"
  | "loan_approved"
  | "loan_rejected"
  | "agreement_ready"
  | "agreement_signed"
  | "funds_sent"
  | "repayment_reminder"
  | "loan_completed"
  | "loan_overdue";

export interface Organization {
  id: string;
  name: string;
  code: string;
  created_at: string;
}

export interface Profile {
  id: string;
  org_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  verification_status: VerificationStatus;
  rejection_reason: string | null;
  id_proof_url: string | null;
  employment_proof_url: string | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Loan {
  id: string;
  org_id: string;
  customer_id: string;
  admin_id: string | null;
  amount: number;
  purpose: string;
  duration_days: number;
  interest_rate_annual: number;
  calculated_interest: number;
  total_repayment: number;
  due_date: string | null;
  status: LoanStatus;
  rejection_reason: string | null;
  disbursal_proof_url: string | null;
  disbursed_at: string | null;
  repayment_proof_url: string | null;
  repayment_submitted_at: string | null;
  late_fee_rate: number | null;
  late_fee_amount: number | null;
  created_at: string;
  approved_at: string | null;
  active_at: string | null;
  completed_at: string | null;
  updated_at: string;
}

export interface Agreement {
  id: string;
  org_id: string;
  loan_id: string;
  agreement_number: string;
  docuseal_submission_id: string | null;
  pdf_url: string | null;
  borrower_signed: boolean;
  borrower_signed_at: string | null;
  lender_signed: boolean;
  lender_signed_at: string | null;
  status: AgreementStatus;
  created_at: string;
  updated_at: string;
}

export interface AppNotification {
  id: string;
  org_id: string;
  user_id: string;
  loan_id: string | null;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  email_sent: boolean;
  created_at: string;
}

// Minimal Database generic shape so @supabase/ssr type params resolve.
// Extend with `supabase gen types typescript` once the project is linked.
export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: Organization;
        Insert: Partial<Organization>;
        Update: Partial<Organization>;
        Relationships: [];
      };
      profiles: {
        Row: Profile;
        Insert: Partial<Profile>;
        Update: Partial<Profile>;
        Relationships: [];
      };
      loans: {
        Row: Loan;
        Insert: Partial<Loan>;
        Update: Partial<Loan>;
        Relationships: [];
      };
      agreements: {
        Row: Agreement;
        Insert: Partial<Agreement>;
        Update: Partial<Agreement>;
        Relationships: [];
      };
      notifications: {
        Row: AppNotification;
        Insert: Partial<AppNotification>;
        Update: Partial<AppNotification>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
