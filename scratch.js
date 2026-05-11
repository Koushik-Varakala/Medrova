const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf-8');
const lines = envFile.split('\n');
let url = '';
let key = '';
for (const line of lines) {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase
    .from("applications")
    .select("*, doctor:doctors(*), shift:shifts(*, clinic:clinics(*)), job:jobs(*, clinic:clinics(*))")
    .limit(1);
  console.log("Error:", error);
  console.log("Data:", JSON.stringify(data, null, 2));
}

run();
