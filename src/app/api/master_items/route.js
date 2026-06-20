import { NextResponse } from 'next/server';
import { sql, initializeDb } from '../../../lib/db';

const DEFAULT_MASTER_ITEMS = [
    { id: 'i1', name: 'Professional Consulting', description: 'Expert advice and project consultation.', rate: 15000.00, gstRate: 18, hsn: '9983' },
    { id: 'i2', name: 'Software Development', description: 'Custom application development and maintenance.', rate: 25000.00, gstRate: 18, hsn: '9983' },
    { id: 'i3', name: 'UI/UX Design Services', description: 'Wireframing, prototyping, and user interface design.', rate: 12000.00, gstRate: 18, hsn: '9983' }
];

export async function GET() {
    try {
        await initializeDb();

        const countResult = await sql`SELECT COUNT(*) FROM master_items`;
        const count = parseInt(countResult[0].count, 10);

        if (count === 0) {
            for (const item of DEFAULT_MASTER_ITEMS) {
                await sql`
                    INSERT INTO master_items (id, data)
                    VALUES (${item.id}, ${JSON.stringify(item)}::jsonb)
                `;
            }
        }

        const result = await sql`SELECT data FROM master_items ORDER BY created_at ASC`;
        return NextResponse.json(result.map(row => row.data));
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        await initializeDb();
        const item = await req.json();

        if (!item.id) {
            item.id = `i${Date.now()}`;
        }

        await sql`
            INSERT INTO master_items (id, data)
            VALUES (${item.id}, ${JSON.stringify(item)}::jsonb)
        `;

        return NextResponse.json({ success: true, item });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
