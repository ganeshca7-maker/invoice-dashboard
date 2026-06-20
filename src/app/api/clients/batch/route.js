import { NextResponse } from 'next/server';
import { sql, initializeDb } from '../../../../lib/db';

export async function POST(req) {
    try {
        await initializeDb();
        const clients = await req.json();

        if (!Array.isArray(clients) || clients.length === 0) {
            return NextResponse.json({ error: 'Expected a non-empty array of clients.' }, { status: 400 });
        }

        let saved = 0, failed = 0;
        const errors = [];

        for (const client of clients) {
            if (!client.name) {
                failed++;
                errors.push('Missing name');
                continue;
            }
            if (!client.id) {
                client.id = `c${Date.now()}${Math.random().toString(36).substr(2,5)}`;
            }
            try {
                // Upsert by name logic:
                // Wait, our Primary Key is `id`, not `name`.
                // If we want to upsert by name, we first select the existing client by name to get its id.
                const existing = await sql`
                    SELECT id FROM clients 
                    WHERE LOWER(data->>'name') = LOWER(${client.name.trim()})
                    LIMIT 1
                `;

                if (existing.length > 0) {
                    const existingId = existing[0].id;
                    client.id = existingId; // retain the same id
                    await sql`
                        UPDATE clients 
                        SET data = ${JSON.stringify(client)}::jsonb 
                        WHERE id = ${existingId}
                    `;
                } else {
                    await sql`
                        INSERT INTO clients (id, data)
                        VALUES (${client.id}, ${JSON.stringify(client)}::jsonb)
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
