import { NextResponse } from 'next/server';
import { sql, initializeDb } from '../../../../lib/db';

export async function PUT(req, { params }) {
    try {
        await initializeDb();
        const clientId = params.id;
        const client = await req.json();

        // Check for duplicates excluding current id
        let existing = [];
        if (client.name && client.email) {
            existing = await sql`
                SELECT id FROM clients 
                WHERE id != ${clientId} 
                AND (
                    LOWER(data->>'name') = LOWER(${client.name.trim()})
                    OR LOWER(data->>'email') = LOWER(${client.email.trim()})
                )
                LIMIT 1
            `;
        } else if (client.name) {
            existing = await sql`
                SELECT id FROM clients 
                WHERE id != ${clientId} 
                AND LOWER(data->>'name') = LOWER(${client.name.trim()})
                LIMIT 1
            `;
        }

        if (existing.length > 0) {
            return NextResponse.json({ error: 'Another customer with this name or email already exists.' }, { status: 400 });
        }

        await sql`
            UPDATE clients 
            SET data = ${JSON.stringify(client)}::jsonb
            WHERE id = ${clientId}
        `;

        return NextResponse.json({ success: true, client });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
