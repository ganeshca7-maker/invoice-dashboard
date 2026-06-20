import { NextResponse } from 'next/server';
import { sql, initializeDb } from '../../../../lib/db';

export async function POST(req) {
    try {
        await initializeDb();
        const invoices = await req.json();

        if (!Array.isArray(invoices) || invoices.length === 0) {
            return NextResponse.json({ error: 'Expected a non-empty array of invoices.' }, { status: 400 });
        }

        let saved = 0, failed = 0;
        const errors = [];

        for (const inv of invoices) {
            if (!inv.id) {
                failed++;
                errors.push('Missing id');
                continue;
            }
            try {
                await sql`
                    INSERT INTO invoices (id, data)
                    VALUES (${inv.id}, ${JSON.stringify(inv)}::jsonb)
                    ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
                `;
                saved++;
            } catch (err) {
                failed++;
                errors.push(err.message);
            }
        }

        return NextResponse.json({ success: true, saved, failed, errors });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
