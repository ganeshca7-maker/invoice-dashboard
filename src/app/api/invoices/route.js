import { NextResponse } from 'next/server';
import { sql, initializeDb } from '../../../lib/db';

const DEFAULT_INVOICES = [
    { id: 'INV-2024-001', clientName: 'Starlight Networks', clientEmail: 'billing@starlight.io', initials: 'SN', date: '2023-10-12', dueDate: '2023-11-12', amount: 12450.00, status: 'Overdue', items: [] },
    { id: 'INV-2024-002', clientName: 'Acme Labs', clientEmail: 'finance@acme.com', initials: 'AL', date: '2023-11-01', dueDate: '2023-12-01', amount: 3200.00, status: 'Paid', items: [] },
    { id: 'INV-2024-003', clientName: 'Urban Dynamics', clientEmail: 'ap@urbandynamics.com', initials: 'UD', date: '2023-11-15', dueDate: '2023-12-15', amount: 8900.00, status: 'Pending', items: [] },
    { id: 'INV-2024-004', clientName: 'Global Tech', clientEmail: 'billing@globaltech.net', initials: 'GT', date: '2023-11-20', dueDate: '2023-12-20', amount: 1500.00, status: 'Paid', items: [] },
    { id: 'INV-2024-005', clientName: 'Vanguard Systems', clientEmail: 'payouts@vanguard.com', initials: 'VS', date: '2023-10-28', dueDate: '2023-11-28', amount: 15800.00, status: 'Overdue', items: [] }
];

export async function GET() {
    try {
        await initializeDb();
        
        const countResult = await sql`SELECT COUNT(*) FROM invoices`;
        const count = parseInt(countResult[0].count, 10);
        
        if (count === 0) {
            for (const inv of DEFAULT_INVOICES) {
                await sql`
                    INSERT INTO invoices (id, data)
                    VALUES (${inv.id}, ${JSON.stringify(inv)}::jsonb)
                `;
            }
        }

        const invoicesResult = await sql`
            SELECT data FROM invoices
            ORDER BY data->>'date' DESC
        `;
        const invoices = invoicesResult.map(row => row.data);
        return NextResponse.json(invoices);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        await initializeDb();
        const invoice = await req.json();

        // Upsert based on `id`
        await sql`
            INSERT INTO invoices (id, data)
            VALUES (${invoice.id}, ${JSON.stringify(invoice)}::jsonb)
            ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
        `;

        return NextResponse.json({ success: true, invoice });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
