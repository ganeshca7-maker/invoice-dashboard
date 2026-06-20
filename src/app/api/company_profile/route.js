import { NextResponse } from 'next/server';
import { sql, initializeDb } from '../../../lib/db';

const DEFAULT_COMPANY_PROFILE = {
    name: 'Compliance-Ready Systems Pvt Ltd',
    logoIcon: 'corporate_fare',
    gstin: '27AAAAA0000A1Z5',
    address1: 'Plot No. 42, Tech Park Central',
    address2: 'BKC',
    address3: '',
    city: 'Mumbai',
    pincode: '400051',
    state: 'Maharashtra',
    country: 'India',
    email: 'billing@complianceready.com',
    phone: '+91 22 4567 8900',
    bankName: 'HDFC BANK LTD',
    accountNumber: '50200012345678',
    ifscCode: 'HDFC0000001',
    accountName: 'Compliance-Ready Systems',
    branchName: 'BKC Branch',
    accountType: 'Current Account'
};

const PROFILE_ID = 'default';

export async function GET() {
    try {
        await initializeDb();

        const result = await sql`
            SELECT data FROM company_profile WHERE id = ${PROFILE_ID}
        `;

        if (result.length === 0) {
            await sql`
                INSERT INTO company_profile (id, data)
                VALUES (${PROFILE_ID}, ${JSON.stringify(DEFAULT_COMPANY_PROFILE)}::jsonb)
            `;
            return NextResponse.json(DEFAULT_COMPANY_PROFILE);
        }

        return NextResponse.json(result[0].data);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        await initializeDb();
        const profile = await req.json();

        await sql`
            INSERT INTO company_profile (id, data)
            VALUES (${PROFILE_ID}, ${JSON.stringify(profile)}::jsonb)
            ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP
        `;

        return NextResponse.json({ success: true, profile });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
