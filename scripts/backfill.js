const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually to avoid needing the 'dotenv' package
const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8')
  .split('\n')
  .filter(line => line.includes('='))
  .reduce((acc, line) => {
    const [key, ...values] = line.split('=');
    acc[key.trim()] = values.join('=').trim().replace(/['"]/g, '');
    return acc;
  }, {});

const supabaseUrl = envConfig['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envConfig['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Fetching completed applications without payouts...");
  
  // Get all completed applications
  const { data: applications, error: appsError } = await supabase
    .from("applications")
    .select("id, shift_id, doctor_id")
    .eq("status", "completed");
    
  if (appsError) {
    console.error("Error fetching applications:", appsError);
    return;
  }
  
  if (!applications || applications.length === 0) {
    console.log("No completed applications found.");
    return;
  }
  
  console.log(`Found ${applications.length} completed applications. Fetching shifts & doctors...`);
  
  let insertedCount = 0;
  
  for (const app of applications) {
    // Check if payout already exists
    const { data: existing } = await supabase
      .from("doctor_payouts")
      .select("id")
      .eq("shift_id", app.shift_id)
      .eq("doctor_id", app.doctor_id)
      .maybeSingle();
      
    if (existing) {
      console.log(`Payout already exists for shift ${app.shift_id}`);
      continue;
    }
    
    // Fetch shift pay
    const { data: shift } = await supabase
      .from("shifts")
      .select("pay")
      .eq("id", app.shift_id)
      .single();
      
    // Fetch doctor UPI
    const { data: doctor } = await supabase
      .from("doctors")
      .select("upi_id")
      .eq("id", app.doctor_id)
      .single();
      
    if (shift && doctor) {
      console.log(`Inserting payout for shift ${app.shift_id} - amount: ${shift.pay}`);
      
      const { error: insertError } = await supabase
        .from("doctor_payouts")
        .insert({
          doctor_id: app.doctor_id,
          shift_id: app.shift_id,
          amount: shift.pay,
          upi_id: doctor.upi_id || "unknown",
          status: "completed",
          paid_at: new Date().toISOString()
        });
        
      if (insertError) {
        console.error("Failed to insert:", insertError);
      } else {
        console.log("Successfully inserted.");
        insertedCount++;
      }
    }
  }
  
  console.log(`Done! Successfully backfilled ${insertedCount} payouts.`);
}

run();
