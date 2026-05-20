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

const ADMIN_USER_ID = '131c5a0a-87f2-410e-9f30-de4ca0fdb3f5';

async function deleteFolderRecursive(bucket, folderPath) {
  const { data: list, error: listError } = await supabase.storage.from(bucket).list(folderPath);
  if (listError) {
    console.error("Storage list error for", folderPath, listError.message);
    return;
  }
  if (!list || list.length === 0) return;

  const filesToDelete = [];
  for (const item of list) {
    const itemPath = folderPath ? `${folderPath}/${item.name}` : item.name;
    // Items with id/created_at represent files
    if (item.id || item.created_at || item.metadata) {
      filesToDelete.push(itemPath);
    } else {
      // It's a directory
      await deleteFolderRecursive(bucket, itemPath);
    }
  }

  if (filesToDelete.length > 0) {
    const { error: deleteError } = await supabase.storage.from(bucket).remove(filesToDelete);
    if (deleteError) {
      console.error("Storage delete error for files:", filesToDelete, deleteError.message);
    } else {
      console.log("Successfully deleted storage files:", filesToDelete);
    }
  }
}

async function run() {
  console.log("=== Medrova Database & Storage Cleanup Script ===");

  // 1. Wipe storage
  console.log("\n1. Wiping Storage files from 'documents' bucket...");
  await deleteFolderRecursive("documents", "");
  console.log("Storage bucket wipe finished.");

  // 2. Wipe public tables in precise dependency order to satisfy foreign keys
  console.log("\n2. Wiping Public Table records...");

  const tablesToClear = [
    "professional_payouts",
    "doctor_payouts",
    "clinic_payments",
    "professional_applications",
    "applications",
    "jobs"
  ];

  for (const table of tablesToClear) {
    const { error } = await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) {
      console.error(`Error deleting from ${table}:`, error.message);
    } else {
      console.log(`Cleared all records from table: ${table}`);
    }
  }

  // Clear shifts: update confirmed keys to null first to prevent circular locks, then delete
  console.log("Clearing shifts table...");
  const { error: shiftUpdateErr } = await supabase
    .from("shifts")
    .update({ confirmed_doctor_id: null, confirmed_professional_id: null })
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (shiftUpdateErr) {
    console.error("Error nullifying confirmed IDs in shifts:", shiftUpdateErr.message);
  }

  const { error: shiftDeleteErr } = await supabase
    .from("shifts")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (shiftDeleteErr) {
    console.error("Error deleting shifts:", shiftDeleteErr.message);
  } else {
    console.log("Cleared all records from table: shifts");
  }

  // Clear user profiles
  const profilesToClear = [
    "doctors",
    "clinics",
    "healthcare_professionals"
  ];

  for (const table of profilesToClear) {
    const { error } = await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) {
      console.error(`Error deleting from ${table}:`, error.message);
    } else {
      console.log(`Cleared all profiles from table: ${table}`);
    }
  }

  // Clear user_roles except the admin user
  console.log("Clearing non-admin user roles...");
  const { error: roleErr } = await supabase
    .from("user_roles")
    .delete()
    .neq("user_id", ADMIN_USER_ID);

  if (roleErr) {
    console.error("Error clearing user roles:", roleErr.message);
  } else {
    console.log("Cleared all non-admin user roles successfully.");
  }

  // 3. Clear Supabase Auth users except the admin user
  console.log("\n3. Listing all Supabase Auth users...");
  const { data: { users }, error: listUsersErr } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000
  });

  if (listUsersErr) {
    console.error("Error listing auth users:", listUsersErr.message);
  } else if (users) {
    const nonAdminUsers = users.filter(u => u.id !== ADMIN_USER_ID);
    console.log(`Found ${nonAdminUsers.length} non-admin user accounts to delete.`);

    for (const u of nonAdminUsers) {
      const { error: deleteUserErr } = await supabase.auth.admin.deleteUser(u.id);
      if (deleteUserErr) {
        console.error(`Error deleting auth user ${u.email} (${u.id}):`, deleteUserErr.message);
      } else {
        console.log(`Successfully deleted auth user: ${u.email} (${u.id})`);
      }
    }
  }

  console.log("\n=== Cleanup Operations Completed ===");
}

run();
