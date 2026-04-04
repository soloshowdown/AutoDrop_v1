
import { supabase } from "../autodrop/src/lib/supabase";

async function checkTasks() {
  const { data, error } = await supabase.from('tasks').select('*');
  if (error) {
    console.error(error);
    return;
  }
  console.log("ALL TASKS:", data);
}

checkTasks();
