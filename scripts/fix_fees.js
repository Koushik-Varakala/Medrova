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
  console.log("Fixing existing clinic_payments amounts...");
  
  // Get all clinic_payments
  const { data: payments, error: err } = await supabase
    .from("clinic_payments")
    .select("id, amount, shift_id");
    
  if (err || !payments) {
    console.error("Error fetching payments:", err);
    return;
  }
  
  let fixedCount = 0;
  
  for (const payment of payments) {
    // If the amount is equal to the shift pay exactly, it's missing the 10% fee.
    // Fetch shift pay
    const { data: shift } = await supabase
      .from("shifts")
      .select("pay")
      .eq("id", payment.shift_id)
      .single();
      
    if (shift && payment.amount === shift.pay) {
      const platformFee = Math.round(shift.pay * 0.10);
      const totalAmountToCharge = shift.pay + platformFee;
      
      console.log(`Fixing payment ${payment.id}: ${payment.amount} -> ${totalAmountToCharge}`);
      
      const { error: updateErr } = await supabase
        .from("clinic_payments")
        .update({ amount: totalAmountToCharge })
        .eq("id", payment.id);
        
      if (!updateErr) {
        fixedCount++;
      }
    }
  }
  
  console.log(`Done! Fixed ${fixedCount} clinic payments to include the 10% platform fee.`);
}

run();
