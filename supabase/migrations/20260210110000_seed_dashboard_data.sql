-- Create a helper function to generate random data (will be dropped after use)
CREATE OR REPLACE FUNCTION generate_dashboard_seed_data()
RETURNS void AS $$
DECLARE
  consultant_user RECORD;
  manager_user RECORD;
  director_user RECORD;
  project_rec RECORD;
  client_rec RECORD;
  system_rec RECORD;
  day_offset INT;
  entry_date DATE;
  statuses time_entry_status[] := ARRAY['pendiente', 'aprobado', 'rechazado', 'aprobado', 'aprobado']::time_entry_status[]; -- weighted towards approved
  chosen_status time_entry_status;
  duration INT;
  start_hour INT;
BEGIN
  -- Ensure we have some users with specific roles for testing if they don't exist
  -- (Assuming auth.users exists, we just ensure public.users roles are set if they match generic emails, 
  --  otherwise we rely on existing users)
  
  -- Update some projects to have work_front
  UPDATE public.projects SET work_front = 'Procesos' WHERE work_front IS NULL AND random() < 0.25;
  UPDATE public.projects SET work_front = 'SAP IBP' WHERE work_front IS NULL AND random() < 0.33;
  UPDATE public.projects SET work_front = 'SAP MDG' WHERE work_front IS NULL AND random() < 0.5;
  UPDATE public.projects SET work_front = 'Otro' WHERE work_front IS NULL;

  -- Generate entries for the last 90 days for all consultants
  FOR consultant_user IN SELECT * FROM public.users WHERE role = 'consultor' LOOP
    FOR day_offset IN 0..90 LOOP
      entry_date := CURRENT_DATE - (day_offset || ' days')::INTERVAL;
      
      -- Skip weekends roughly
      IF extract(isodow from entry_date) < 6 THEN
        -- 80% chance to have entry
        IF random() < 0.8 THEN
           -- Pick a random project
           SELECT * INTO project_rec FROM public.projects ORDER BY random() LIMIT 1;
           
           IF project_rec.id IS NOT NULL THEN
               -- Ensure assignment
               INSERT INTO public.project_assignments (project_id, user_id) 
               VALUES (project_rec.id, consultant_user.id)
               ON CONFLICT DO NOTHING;
               
               duration := (floor(random() * 4) + 4) * 60; -- 4 to 8 hours
               start_hour := 9;
               chosen_status := statuses[floor(random()*array_length(statuses, 1) + 1)::INT];
               
               INSERT INTO public.time_entries (
                 user_id, project_id, fecha, startTime, endTime, description, durationMinutes, status
               ) VALUES (
                 consultant_user.id,
                 project_rec.id,
                 entry_date,
                 to_char(start_hour, 'FM00') || ':00',
                 to_char(start_hour + (duration/60), 'FM00') || ':00',
                 'Actividad de soporte y desarrollo en ' || project_rec.nombre,
                 duration,
                 chosen_status
               );
           END IF;
        END IF;
      END IF;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute seed
SELECT generate_dashboard_seed_data();

-- Cleanup
DROP FUNCTION generate_dashboard_seed_data();
