import { NextResponse } from 'next/server';
import { sql, initializeDb } from '../../../../lib/db';

export async function POST(req) {
    try {
        await initializeDb();
        const items = await req.json();

        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: 'Expected a non-empty array of items.' }, { status: 400 });
        }

        let saved = 0, failed = 0;
        const errors = [];

        for (const item of items) {
            if (!item.name) {
                failed++;
                errors.push('Missing name');
                continue;
            }

            if (!item.id) {
                item.id = `i${Date.now()}${Math.random().toString(36).substr(2,5)}`;
            }

            try {
                // Upsert by name
                const existing = await sql`
                    SELECT id FROM master_items 
                    WHERE LOWER(data->>'name') = LOWER(${item.name.trim()})
                    LIMIT 1
                `;

                if (existing.length > 0) {
                    const existingId = existing[0].id;
                    item.id = existingId;
                    await sql`
                        UPDATE master_items 
                        SET data = ${JSON.stringify(item)}::jsonb 
                        WHERE id = ${existingId}
                    `;
                } else {
                    await sql`
                        INSERT INTO master_items (id, data)
                        VALUES (${item.id}, ${JSON.stringify(item)}::jsonb)
                    `;
                }
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
