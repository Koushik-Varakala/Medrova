import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const service = createSupabaseServiceClient();
    
    if (!service) {
      return NextResponse.json({ error: "Supabase service client not configured." }, { status: 500 });
    }

    const DUMMY_PDF_URL = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

    // 1. Update newer healthcare_professionals table
    const { data: profs, error: profsError } = await service
      .from('healthcare_professionals')
      .update({ 
        primary_cert_url: DUMMY_PDF_URL,
        degree_cert_url: DUMMY_PDF_URL,
        gov_id_url: DUMMY_PDF_URL
      })
      // Only update those that don't have a document yet
      .is('primary_cert_url', null)
      .select('id');

    // 2. Update legacy doctors table
    const { data: docs, error: docsError } = await service
      .from('doctors')
      .update({ 
        mci_cert_url: DUMMY_PDF_URL,
        degree_cert_url: DUMMY_PDF_URL,
        gov_id_url: DUMMY_PDF_URL
      })
      .is('mci_cert_url', null)
      .select('id');

    return NextResponse.json({
      message: "Successfully seeded dummy documents!",
      updatedProfessionals: profs?.length ?? 0,
      updatedLegacyDoctors: docs?.length ?? 0,
      details: {
        profsError: profsError?.message || null,
        docsError: docsError?.message || null
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
