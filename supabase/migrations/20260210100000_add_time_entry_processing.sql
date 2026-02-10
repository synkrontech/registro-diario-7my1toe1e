-- Add columns to track who processed the time entry and when
ALTER TABLE public.time_entries ADD COLUMN processed_by UUID REFERENCES public.users(id);
ALTER TABLE public.time_entries ADD COLUMN processed_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster filtering on status and dates
CREATE INDEX time_entries_status_date_idx ON public.time_entries (status, fecha);
CREATE INDEX time_entries_processed_by_idx ON public.time_entries (processed_by);
