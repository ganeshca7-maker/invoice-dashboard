import { NextResponse } from 'next/server';
import { sql, initializeDb } from '../../../lib/db';

const DEFAULT_SETTINGS = {
    prefix: 'INV',
    nextStart: '001',
    suffix: '',
    startDate: '',
    resetDate: '',
    adminOverride: false
};

const SETTINGS_ID = 'default';

export async function GET() {
    try {
        await initializeDb();

        const result = await sql`
            SELECT data FROM invoice_settings WHERE id = ${SETTINGS_ID}
        `;

        if (result.length === 0) {
            await sql`
                INSERT INTO invoice_settings (id, data)
                VALUES (${SETTINGS_ID}, ${JSON.stringify(DEFAULT_SETTINGS)}::jsonb)
            `;
            return NextResponse.json(DEFAULT_SETTINGS);
        }

        return NextResponse.json(result[0].data);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        await initializeDb();
        const settings = await req.json();

        await sql`
            INSERT INTO invoice_settings (id, data)
            VALUES (${SETTINGS_ID}, ${JSON.stringify(settings)}::jsonb)
            ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP
        `;

        return NextResponse.json({ success: true, settings });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
