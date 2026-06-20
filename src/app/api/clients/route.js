import { NextResponse } from 'next/server';
import { sql, initializeDb } from '../../../lib/db';

const DEFAULT_CLIENTS = [
    { id: 'c1', name: 'Acme Global Holdings', company: 'Acme Corp', email: 'billing@acme.com', phone: '+1-555-0199', status: 'Active', initials: 'AG', lastInvoice: '12 days ago', address1: '100 Main Street', address2: 'Suite 400', address3: '', city: 'New York', pincode: '10001', state: 'NY', country: 'United States', currency: 'USD ($)', bankAccounts: [] },
    { id: 'c2', name: 'TechFlow Solutions', company: 'TechFlow Ltd', email: 'accounts@stellar.io', phone: '+1-555-0245', status: 'Active', initials: 'TF', lastInvoice: '2 months ago', address1: '45 Science Park', address2: 'Building B', address3: 'Floor 2', city: 'San Francisco', pincode: '94107', state: 'CA', country: 'United States', currency: 'USD ($)', bankAccounts: [] },
    { id: 'c3', name: 'Jonathan Wright', company: 'Individual', email: 'j.wright@personal.me', phone: '+44-7911-123456', status: 'Active', initials: 'JW', lastInvoice: 'Oct 24, 2023', address1: '74 High Street', address2: '', address3: '', city: 'Oxford', pincode: 'OX1 4DP', state: 'Oxfordshire', country: 'United Kingdom', currency: 'EUR (€)', bankAccounts: [] },
    { id: 'c4', name: 'Nexus Partners', company: 'Nexus Inc', email: 'contact@nexuspartners.com', phone: '+65-6123-4567', status: 'Inactive', initials: 'NP', lastInvoice: 'Never', address1: '12 Marina Boulevard', address2: 'Tower 3', address3: '#18-02', city: 'Singapore', pincode: '018982', state: 'Downtown Core', country: 'Singapore', currency: 'USD ($)', bankAccounts: [] }
];

export async function GET() {
    try {
        await initializeDb();
        
        const countResult = await sql`SELECT COUNT(*) FROM clients`;
        const count = parseInt(countResult[0].count, 10);
        
        if (count === 0) {
            for (const client of DEFAULT_CLIENTS) {
                await sql`
                    INSERT INTO clients (id, data)
                    VALUES (${client.id}, ${JSON.stringify(client)}::jsonb)
                `;
            }
        }

        const clientsResult = await sql`
            SELECT data FROM clients
            ORDER BY data->>'name' ASC
        `;
        const clients = clientsResult.map(row => row.data);
        return NextResponse.json(clients);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        await initializeDb();
        const client = await req.json();

        // Check for duplicates (case-insensitive name or email)
        // using JSONB operators
        
        let existing = [];
        if (client.name && client.email) {
            existing = await sql`
                SELECT id FROM clients 
                WHERE LOWER(data->>'name') = LOWER(${client.name.trim()})
                   OR LOWER(data->>'email') = LOWER(${client.email.trim()})
                LIMIT 1
            `;
        } else if (client.name) {
            existing = await sql`
                SELECT id FROM clients 
                WHERE LOWER(data->>'name') = LOWER(${client.name.trim()})
                LIMIT 1
            `;
        }

        if (existing.length > 0) {
            return NextResponse.json({ error: 'A customer with this name or email already exists.' }, { status: 400 });
        }

        if (!client.id) {
            client.id = `c${Date.now()}`;
        }

        await sql`
            INSERT INTO clients (id, data)
            VALUES (${client.id}, ${JSON.stringify(client)}::jsonb)
        `;

        return NextResponse.json({ success: true, client });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
