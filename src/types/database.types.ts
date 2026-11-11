
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "activity_logs": {
                  Row: {
                    "action": string,"actor_id": string | null,"created_at": string,"details": NonNullable<Json>,"entity_id": string | null,"entity_type": string | null,"id": number
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"created_at"?: string,"details"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type"?: string | null,"id"?: never
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"created_at"?: string,"details"?: NonNullable<Json>,"entity_id"?: string | null,"entity_type"?: string | null,"id"?: never
                  }
                  Relationships: [
                    {
      foreignKeyName: "activity_logs_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"book_copies": {
                  Row: {
                    "acquired_at": string | null,"book_id": number,"code": string,"created_at": string,"id": number,"notes": string | null,"price": number | null,"source": Database["public"]['Enums']["copy_source"] | null,"status": Database["public"]['Enums']["copy_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "acquired_at"?: string | null,"book_id": number,"code": string,"created_at"?: string,"id"?: never,"notes"?: string | null,"price"?: number | null,"source"?: Database["public"]['Enums']["copy_source"] | null,"status"?: Database["public"]['Enums']["copy_status"],"updated_at"?: string
                  }
                  Update: {
                    "acquired_at"?: string | null,"book_id"?: number,"code"?: string,"created_at"?: string,"id"?: never,"notes"?: string | null,"price"?: number | null,"source"?: Database["public"]['Enums']["copy_source"] | null,"status"?: Database["public"]['Enums']["copy_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "book_copies_book_id_fkey"
      columns: ["book_id"]
isOneToOne: false
      referencedRelation: "books"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "book_copies_book_id_fkey"
      columns: ["book_id"]
isOneToOne: false
      referencedRelation: "v_book_availability"
      referencedColumns: ["book_id"]
    },{
      foreignKeyName: "book_copies_book_id_fkey"
      columns: ["book_id"]
isOneToOne: false
      referencedRelation: "v_loans"
      referencedColumns: ["book_id"]
    }
                  ]
                },"books": {
                  Row: {
                    "authors": string,"call_number": string | null,"category_id": number,"cover_path": string | null,"created_at": string,"created_by": string | null,"edition": string | null,"id": number,"isbn": string | null,"language": string,"pages": number | null,"publication_year": number | null,"publisher": string | null,"synopsis": string | null,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "authors": string,"call_number"?: string | null,"category_id": number,"cover_path"?: string | null,"created_at"?: string,"created_by"?: string | null,"edition"?: string | null,"id"?: never,"isbn"?: string | null,"language"?: string,"pages"?: number | null,"publication_year"?: number | null,"publisher"?: string | null,"synopsis"?: string | null,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "authors"?: string,"call_number"?: string | null,"category_id"?: number,"cover_path"?: string | null,"created_at"?: string,"created_by"?: string | null,"edition"?: string | null,"id"?: never,"isbn"?: string | null,"language"?: string,"pages"?: number | null,"publication_year"?: number | null,"publisher"?: string | null,"synopsis"?: string | null,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "books_category_id_fkey"
      columns: ["category_id"]
isOneToOne: false
      referencedRelation: "categories"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "books_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"categories": {
                  Row: {
                    "created_at": string,"ddc_code": string | null,"id": number,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"ddc_code"?: string | null,"id"?: never,"name": string
                  }
                  Update: {
                    "created_at"?: string,"ddc_code"?: string | null,"id"?: never,"name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"fines": {
                  Row: {
                    "amount": number,"created_at": string,"created_by": string | null,"days_late": number | null,"id": number,"loan_id": number,"member_id": string,"notes": string | null,"paid_at": string | null,"received_by": string | null,"status": Database["public"]['Enums']["fine_status"],"type": Database["public"]['Enums']["fine_type"],"updated_at": string,"waived_at": string | null,"waived_by": string | null,"waived_reason": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "amount": number,"created_at"?: string,"created_by"?: string | null,"days_late"?: number | null,"id"?: never,"loan_id": number,"member_id": string,"notes"?: string | null,"paid_at"?: string | null,"received_by"?: string | null,"status"?: Database["public"]['Enums']["fine_status"],"type": Database["public"]['Enums']["fine_type"],"updated_at"?: string,"waived_at"?: string | null,"waived_by"?: string | null,"waived_reason"?: string | null
                  }
                  Update: {
                    "amount"?: number,"created_at"?: string,"created_by"?: string | null,"days_late"?: number | null,"id"?: never,"loan_id"?: number,"member_id"?: string,"notes"?: string | null,"paid_at"?: string | null,"received_by"?: string | null,"status"?: Database["public"]['Enums']["fine_status"],"type"?: Database["public"]['Enums']["fine_type"],"updated_at"?: string,"waived_at"?: string | null,"waived_by"?: string | null,"waived_reason"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "fines_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "fines_loan_id_fkey"
      columns: ["loan_id"]
isOneToOne: false
      referencedRelation: "loans"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "fines_loan_id_fkey"
      columns: ["loan_id"]
isOneToOne: false
      referencedRelation: "v_loans"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "fines_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "fines_received_by_fkey"
      columns: ["received_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "fines_waived_by_fkey"
      columns: ["waived_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"library_settings": {
                  Row: {
                    "address": string,"id": number,"library_name": string,"logo_path": string | null,"school_name": string,"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string,"id"?: number,"library_name"?: string,"logo_path"?: string | null,"school_name"?: string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "address"?: string,"id"?: number,"library_name"?: string,"logo_path"?: string | null,"school_name"?: string,"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
                      foreignKeyName: "library_settings_updated_by_fkey"
                      columns: ["updated_by"]
                      isOneToOne: false
                      referencedRelation: "profiles"
                      referencedColumns: ["id"]
                    }
                  ]
                },"loan_policies": {
                  Row: {
                    "daily_fine": number,"loan_days": number,"max_active_loans": number,"pickup_days": number,"role": Database["public"]['Enums']["app_role"],"updated_at": string,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "daily_fine": number,"loan_days": number,"max_active_loans": number,"pickup_days": number,"role": Database["public"]['Enums']["app_role"],"updated_at"?: string,"updated_by"?: string | null
                  }
                  Update: {
                    "daily_fine"?: number,"loan_days"?: number,"max_active_loans"?: number,"pickup_days"?: number,"role"?: Database["public"]['Enums']["app_role"],"updated_at"?: string,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "loan_policies_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"loan_requests": {
                  Row: {
                    "book_id": number,"closed_at": string | null,"created_at": string,"decided_at": string | null,"decided_by": string | null,"id": number,"member_id": string,"notes": string | null,"pickup_deadline": string | null,"reject_reason": string | null,"requested_at": string,"reserved_copy_id": number | null,"status": Database["public"]['Enums']["loan_request_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "book_id": number,"closed_at"?: string | null,"created_at"?: string,"decided_at"?: string | null,"decided_by"?: string | null,"id"?: never,"member_id": string,"notes"?: string | null,"pickup_deadline"?: string | null,"reject_reason"?: string | null,"requested_at"?: string,"reserved_copy_id"?: number | null,"status"?: Database["public"]['Enums']["loan_request_status"],"updated_at"?: string
                  }
                  Update: {
                    "book_id"?: number,"closed_at"?: string | null,"created_at"?: string,"decided_at"?: string | null,"decided_by"?: string | null,"id"?: never,"member_id"?: string,"notes"?: string | null,"pickup_deadline"?: string | null,"reject_reason"?: string | null,"requested_at"?: string,"reserved_copy_id"?: number | null,"status"?: Database["public"]['Enums']["loan_request_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "loan_requests_book_id_fkey"
      columns: ["book_id"]
isOneToOne: false
      referencedRelation: "books"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "loan_requests_book_id_fkey"
      columns: ["book_id"]
isOneToOne: false
      referencedRelation: "v_book_availability"
      referencedColumns: ["book_id"]
    },{
      foreignKeyName: "loan_requests_book_id_fkey"
      columns: ["book_id"]
isOneToOne: false
      referencedRelation: "v_loans"
      referencedColumns: ["book_id"]
    },{
      foreignKeyName: "loan_requests_decided_by_fkey"
      columns: ["decided_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "loan_requests_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "loan_requests_reserved_copy_id_fkey"
      columns: ["reserved_copy_id"]
isOneToOne: false
      referencedRelation: "book_copies"
      referencedColumns: ["id"]
    }
                  ]
                },"loans": {
                  Row: {
                    "checked_in_by": string | null,"checked_out_by": string,"copy_id": number,"created_at": string,"daily_fine_snapshot": number,"due_date": string,"id": number,"loaned_at": string,"lost_at": string | null,"member_id": string,"notes": string | null,"request_id": number | null,"return_condition": string | null,"return_requested_at": string | null,"returned_at": string | null,"status": Database["public"]['Enums']["loan_status"],"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "checked_in_by"?: string | null,"checked_out_by": string,"copy_id": number,"created_at"?: string,"daily_fine_snapshot": number,"due_date": string,"id"?: never,"loaned_at"?: string,"lost_at"?: string | null,"member_id": string,"notes"?: string | null,"request_id"?: number | null,"return_condition"?: string | null,"return_requested_at"?: string | null,"returned_at"?: string | null,"status"?: Database["public"]['Enums']["loan_status"],"updated_at"?: string
                  }
                  Update: {
                    "checked_in_by"?: string | null,"checked_out_by"?: string,"copy_id"?: number,"created_at"?: string,"daily_fine_snapshot"?: number,"due_date"?: string,"id"?: never,"loaned_at"?: string,"lost_at"?: string | null,"member_id"?: string,"notes"?: string | null,"request_id"?: number | null,"return_condition"?: string | null,"return_requested_at"?: string | null,"returned_at"?: string | null,"status"?: Database["public"]['Enums']["loan_status"],"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "loans_checked_in_by_fkey"
      columns: ["checked_in_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "loans_checked_out_by_fkey"
      columns: ["checked_out_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "loans_copy_id_fkey"
      columns: ["copy_id"]
isOneToOne: false
      referencedRelation: "book_copies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "loans_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "loans_request_id_fkey"
      columns: ["request_id"]
isOneToOne: true
      referencedRelation: "loan_requests"
      referencedColumns: ["id"]
    }
                  ]
                },"majors": {
                  Row: {
                    "code": string,"created_at": string,"id": number,"is_active": boolean,"name": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"created_at"?: string,"id"?: never,"is_active"?: boolean,"name": string,"updated_at"?: string
                  }
                  Update: {
                    "code"?: string,"created_at"?: string,"id"?: never,"is_active"?: boolean,"name"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "class_name": string | null,"created_at": string,"full_name": string,"id": string,"is_active": boolean,"login_id": string | null,"major_id": number | null,"member_code": string,"must_change_password": boolean,"phone": string | null,"photo_path": string | null,"position": string | null,"role": Database["public"]['Enums']["app_role"],"subject": string | null,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "class_name"?: string | null,"created_at"?: string,"full_name": string,"id": string,"is_active"?: boolean,"login_id"?: never,"major_id"?: number | null,"member_code": string,"must_change_password"?: boolean,"phone"?: string | null,"photo_path"?: string | null,"position"?: string | null,"role": Database["public"]['Enums']["app_role"],"subject"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "class_name"?: string | null,"created_at"?: string,"full_name"?: string,"id"?: string,"is_active"?: boolean,"login_id"?: never,"major_id"?: number | null,"member_code"?: string,"must_change_password"?: boolean,"phone"?: string | null,"photo_path"?: string | null,"position"?: string | null,"role"?: Database["public"]['Enums']["app_role"],"subject"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profiles_major_id_fkey"
      columns: ["major_id"]
isOneToOne: false
      referencedRelation: "majors"
      referencedColumns: ["id"]
    }
                  ]
                },"teaching_materials": {
                  Row: {
                    "created_at": string,"description": string | null,"download_count": number,"file_name": string,"file_path": string,"file_size": number,"grade_level": number | null,"hidden_by": string | null,"hidden_reason": string | null,"id": number,"major_id": number | null,"mime_type": string,"status": Database["public"]['Enums']["material_status"],"subject": string,"teacher_id": string,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"description"?: string | null,"download_count"?: number,"file_name": string,"file_path": string,"file_size": number,"grade_level"?: number | null,"hidden_by"?: string | null,"hidden_reason"?: string | null,"id"?: never,"major_id"?: number | null,"mime_type": string,"status"?: Database["public"]['Enums']["material_status"],"subject": string,"teacher_id": string,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"description"?: string | null,"download_count"?: number,"file_name"?: string,"file_path"?: string,"file_size"?: number,"grade_level"?: number | null,"hidden_by"?: string | null,"hidden_reason"?: string | null,"id"?: never,"major_id"?: number | null,"mime_type"?: string,"status"?: Database["public"]['Enums']["material_status"],"subject"?: string,"teacher_id"?: string,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "teaching_materials_hidden_by_fkey"
      columns: ["hidden_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "teaching_materials_major_id_fkey"
      columns: ["major_id"]
isOneToOne: false
      referencedRelation: "majors"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "teaching_materials_teacher_id_fkey"
      columns: ["teacher_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "v_book_availability": {
                  Row: {
                    "available_copies": number | null,"book_id": number,"on_loan_copies": number | null,"reserved_copies": number | null,"total_copies": number | null
                  }
                  ComputedFields: never
                  Relationships: [
                    
                  ]
                },"v_loans": {
                  Row: {
                    "authors": string,"book_id": number,"checked_in_by": string | null,"checked_out_by": string,"class_name": string | null,"copy_code": string,"copy_id": number,"cover_path": string | null,"created_at": string,"daily_fine_snapshot": number,"days_overdue": number | null,"due_date": string,"estimated_fine": number | null,"full_name": string,"id": number,"is_overdue": boolean | null,"loaned_at": string,"lost_at": string | null,"member_code": string,"member_id": string,"notes": string | null,"request_id": number | null,"return_condition": string | null,"return_requested_at": string | null,"returned_at": string | null,"role": Database["public"]['Enums']["app_role"],"status": Database["public"]['Enums']["loan_status"],"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "loans_checked_in_by_fkey"
      columns: ["checked_in_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "loans_checked_out_by_fkey"
      columns: ["checked_out_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "loans_copy_id_fkey"
      columns: ["copy_id"]
isOneToOne: false
      referencedRelation: "book_copies"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "loans_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "loans_request_id_fkey"
      columns: ["request_id"]
isOneToOne: true
      referencedRelation: "loan_requests"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "add_book_copies":
{ Args: { "p_acquired_at"?: string,"p_book_id": number,"p_codes"?: (string)[],"p_price"?: number,"p_quantity"?: number,"p_source"?: Database["public"]['Enums']["copy_source"] }; Returns: {
              "acquired_at": string | null,
"book_id": number,
"code": string,
"created_at": string,
"id": number,
"notes": string | null,
"price": number | null,
"source": Database["public"]['Enums']["copy_source"] | null,
"status": Database["public"]['Enums']["copy_status"],
"updated_at": string
            }[]
                          SetofOptions: {
        from: "*"
        to: "book_copies"
        isOneToOne: false
        isSetofReturn: true
      } },
"approve_loan_request":
{ Args: { "p_copy_id"?: number,"p_request_id": number }; Returns: {
              "book_id": number,
"closed_at": string | null,
"created_at": string,
"decided_at": string | null,
"decided_by": string | null,
"id": number,
"member_id": string,
"notes": string | null,
"pickup_deadline": string | null,
"reject_reason": string | null,
"requested_at": string,
"reserved_copy_id": number | null,
"status": Database["public"]['Enums']["loan_request_status"],
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "loan_requests"
        isOneToOne: true
        isSetofReturn: false
      } },
"cancel_loan_request":
{ Args: { "p_request_id": number }; Returns: {
              "book_id": number,
"closed_at": string | null,
"created_at": string,
"decided_at": string | null,
"decided_by": string | null,
"id": number,
"member_id": string,
"notes": string | null,
"pickup_deadline": string | null,
"reject_reason": string | null,
"requested_at": string,
"reserved_copy_id": number | null,
"status": Database["public"]['Enums']["loan_request_status"],
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "loan_requests"
        isOneToOne: true
        isSetofReturn: false
      } },
"checkin_copy":
{ Args: { "p_condition"?: string,"p_copy_code": string,"p_damage_fine"?: number,"p_notes"?: string }; Returns: Json
                           },
"checkin_loan":
{ Args: { "p_condition"?: string,"p_copy_code": string,"p_damage_fine"?: number,"p_notes"?: string }; Returns: Json
                           },
"checkout_copy":
{ Args: { "p_copy_code": string,"p_member_id": string }; Returns: {
              "checked_in_by": string | null,
"checked_out_by": string,
"copy_id": number,
"created_at": string,
"daily_fine_snapshot": number,
"due_date": string,
"id": number,
"loaned_at": string,
"lost_at": string | null,
"member_id": string,
"notes": string | null,
"request_id": number | null,
"return_condition": string | null,
"return_requested_at": string | null,
"returned_at": string | null,
"status": Database["public"]['Enums']["loan_status"],
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "loans"
        isOneToOne: true
        isSetofReturn: false
      } },
"checkout_loan":
{ Args: { "p_copy_code": string,"p_member_id": string }; Returns: {
              "checked_in_by": string | null,
"checked_out_by": string,
"copy_id": number,
"created_at": string,
"daily_fine_snapshot": number,
"due_date": string,
"id": number,
"loaned_at": string,
"lost_at": string | null,
"member_id": string,
"notes": string | null,
"request_id": number | null,
"return_condition": string | null,
"return_requested_at": string | null,
"returned_at": string | null,
"status": Database["public"]['Enums']["loan_status"],
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "loans"
        isOneToOne: true
        isSetofReturn: false
      } },
"complete_password_change":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"delete_book":
{ Args: { "p_book_id": number }; Returns: undefined
                           },
"increment_material_downloads":
{ Args: { "p_material_id": number }; Returns: undefined
                           },
"lookup_copy":
{ Args: { "p_code": string }; Returns: Json
                           },
"lookup_member":
{ Args: { "p_code": string }; Returns: Json
                           },
"mark_loan_lost":
{ Args: { "p_amount"?: number,"p_loan_id": number,"p_notes"?: string }; Returns: {
              "checked_in_by": string | null,
"checked_out_by": string,
"copy_id": number,
"created_at": string,
"daily_fine_snapshot": number,
"due_date": string,
"id": number,
"loaned_at": string,
"lost_at": string | null,
"member_id": string,
"notes": string | null,
"request_id": number | null,
"return_condition": string | null,
"return_requested_at": string | null,
"returned_at": string | null,
"status": Database["public"]['Enums']["loan_status"],
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "loans"
        isOneToOne: true
        isSetofReturn: false
      } },
"pay_fine":
{ Args: { "p_fine_id": number }; Returns: {
              "amount": number,
"created_at": string,
"created_by": string | null,
"days_late": number | null,
"id": number,
"loan_id": number,
"member_id": string,
"notes": string | null,
"paid_at": string | null,
"received_by": string | null,
"status": Database["public"]['Enums']["fine_status"],
"type": Database["public"]['Enums']["fine_type"],
"updated_at": string,
"waived_at": string | null,
"waived_by": string | null,
"waived_reason": string | null
            }
                          SetofOptions: {
        from: "*"
        to: "fines"
        isOneToOne: true
        isSetofReturn: false
      } },
"reject_loan_request":
{ Args: { "p_reason": string,"p_request_id": number }; Returns: {
              "book_id": number,
"closed_at": string | null,
"created_at": string,
"decided_at": string | null,
"decided_by": string | null,
"id": number,
"member_id": string,
"notes": string | null,
"pickup_deadline": string | null,
"reject_reason": string | null,
"requested_at": string,
"reserved_copy_id": number | null,
"status": Database["public"]['Enums']["loan_request_status"],
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "loan_requests"
        isOneToOne: true
        isSetofReturn: false
      } },
"request_loan":
{ Args: { "p_book_id": number }; Returns: {
              "book_id": number,
"closed_at": string | null,
"created_at": string,
"decided_at": string | null,
"decided_by": string | null,
"id": number,
"member_id": string,
"notes": string | null,
"pickup_deadline": string | null,
"reject_reason": string | null,
"requested_at": string,
"reserved_copy_id": number | null,
"status": Database["public"]['Enums']["loan_request_status"],
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "loan_requests"
        isOneToOne: true
        isSetofReturn: false
      } },
"request_return":
{ Args: { "p_loan_id": number }; Returns: {
              "checked_in_by": string | null,
"checked_out_by": string,
"copy_id": number,
"created_at": string,
"daily_fine_snapshot": number,
"due_date": string,
"id": number,
"loaned_at": string,
"lost_at": string | null,
"member_id": string,
"notes": string | null,
"request_id": number | null,
"return_condition": string | null,
"return_requested_at": string | null,
"returned_at": string | null,
"status": Database["public"]['Enums']["loan_status"],
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "loans"
        isOneToOne: true
        isSetofReturn: false
      } },
"search_catalog":
{ Args: { "p_available_only"?: boolean,"p_category_id"?: number,"p_limit"?: number,"p_offset"?: number,"p_query"?: string,"p_sort"?: string }; Returns: {
              "authors": string,"available_copies": number,"call_number": string,"category_id": number,"category_name": string,"cover_path": string,"created_at": string,"edition": string,"id": number,"isbn": string,"language": string,"pages": number,"publication_year": number,"publisher": string,"synopsis": string,"title": string,"total_copies": number,"total_count": number,"updated_at": string
            }[]
                           },
"set_copy_status":
{ Args: { "p_copy_id": number,"p_notes"?: string,"p_status": Database["public"]['Enums']["copy_status"] }; Returns: {
              "acquired_at": string | null,
"book_id": number,
"code": string,
"created_at": string,
"id": number,
"notes": string | null,
"price": number | null,
"source": Database["public"]['Enums']["copy_source"] | null,
"status": Database["public"]['Enums']["copy_status"],
"updated_at": string
            }
                          SetofOptions: {
        from: "*"
        to: "book_copies"
        isOneToOne: true
        isSetofReturn: false
      } },
"set_material_visibility":
{ Args: { "p_material_id": number,"p_reason"?: string,"p_visible": boolean }; Returns: undefined
                           },
"waive_fine":
{ Args: { "p_fine_id": number,"p_reason": string }; Returns: {
              "amount": number,
"created_at": string,
"created_by": string | null,
"days_late": number | null,
"id": number,
"loan_id": number,
"member_id": string,
"notes": string | null,
"paid_at": string | null,
"received_by": string | null,
"status": Database["public"]['Enums']["fine_status"],
"type": Database["public"]['Enums']["fine_type"],
"updated_at": string,
"waived_at": string | null,
"waived_by": string | null,
"waived_reason": string | null
            }
                          SetofOptions: {
        from: "*"
        to: "fines"
        isOneToOne: true
        isSetofReturn: false
      } },
"get_librarian_dashboard":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"report_fines":
{ Args: { "p_from": string,"p_to": string }; Returns: {
              "amount": number,
              "class_name": string | null,
              "created_at": string,
              "fine_id": number,
              "loan_id": number,
              "member_code": string,
              "member_name": string,
              "paid_at": string | null,
              "status": Database["public"]['Enums']["fine_status"],
              "title": string,
              "type": Database["public"]['Enums']["fine_type"],
              "waived_at": string | null,
              "waived_reason": string | null
            }[]
                           },
"report_inventory":
{ Args: Record<PropertyKey, never>; Returns: {
              "authors": string,
              "available_copies": number,
              "book_id": number,
              "category_name": string,
              "damaged_copies": number,
              "isbn": string | null,
              "lost_copies": number,
              "on_loan_copies": number,
              "reserved_copies": number,
              "title": string,
              "total_copies": number,
              "withdrawn_copies": number
            }[]
                           },
"report_loans":
{ Args: { "p_from": string,"p_to": string }; Returns: {
              "class_name": string | null,
              "copy_code": string,
              "due_date": string,
              "loan_id": number,
              "loaned_at": string,
              "member_code": string,
              "member_name": string,
              "returned_at": string | null,
              "status": Database["public"]['Enums']["loan_status"],
              "title": string
            }[]
                           },
"report_member_activity":
{ Args: { "p_from": string,"p_to": string }; Returns: {
              "class_name": string | null,
              "full_name": string,
              "member_code": string,
              "member_id": string,
              "overdue_loans": number,
              "returned_loans": number,
              "role": Database["public"]['Enums']["app_role"],
              "total_loans": number
            }[]
                           },
"report_overdue":
{ Args: { "p_as_of"?: string }; Returns: {
              "class_name": string | null,
              "copy_code": string,
              "daily_fine_snapshot": number,
              "days_overdue": number,
              "due_date": string,
              "estimated_fine": number,
              "loan_id": number,
              "loaned_at": string,
              "member_code": string,
              "member_name": string,
              "title": string
            }[]
                           },
"report_popular_books":
{ Args: { "p_from": string,"p_limit"?: number,"p_to": string }; Returns: {
              "authors": string,
              "book_id": number,
              "borrow_count": number,
              "category_name": string,
              "title": string
            }[]
                           },
"report_returns":
{ Args: { "p_from": string,"p_to": string }; Returns: {
              "class_name": string | null,
              "copy_code": string,
              "days_overdue": number,
              "due_date": string,
              "fine_amount": number,
              "fine_status": Database["public"]['Enums']["fine_status"] | null,
              "loan_id": number,
              "loaned_at": string,
              "member_code": string,
              "member_name": string,
              "returned_at": string,
              "title": string
            }[]
                           }
          }
          Enums: {
            "app_role": "student"|"teacher"|"librarian","copy_source": "purchase"|"donation"|"government"|"other","copy_status": "available"|"reserved"|"on_loan"|"damaged"|"lost"|"withdrawn","fine_status": "unpaid"|"paid"|"waived","fine_type": "late"|"damage"|"loss","loan_request_status": "pending"|"approved"|"rejected"|"cancelled"|"expired"|"fulfilled","loan_status": "active"|"returned"|"lost","material_status": "published"|"hidden"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "app_role": ["student", "teacher", "librarian"],"copy_source": ["purchase", "donation", "government", "other"],"copy_status": ["available", "reserved", "on_loan", "damaged", "lost", "withdrawn"],"fine_status": ["unpaid", "paid", "waived"],"fine_type": ["late", "damage", "loss"],"loan_request_status": ["pending", "approved", "rejected", "cancelled", "expired", "fulfilled"],"loan_status": ["active", "returned", "lost"],"material_status": ["published", "hidden"]
          }
        }
} as const
