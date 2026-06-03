export type Slot = {
  rule_id: string;
  slot_start: string;
  slot_end: string;
  modality: string;
  max_participants: number;
  booked: number;
};

export type SlotDate = {
  slot_date: string;
};

export type RuleV2 = {
  id: string;
  day_of_week: number | null;
  specific_date: string | null;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  modality: string;
  session_type: string;
  max_participants: number;
  max_online: number | null;
  max_presencial: number | null;
  service_id: string | null;
  is_active: boolean;
  services?: { id: string; name: string; slug: string } | null;
};
