import { NextResponse } from 'next/server';
import { sql, initializeDb } from '../../../lib/db';

const DEFAULT_COUNTRIES = [
    'Afghanistan', 'Australia', 'Bangladesh', 'Canada', 'China',
    'France', 'Germany', 'Italy', 'Japan', 'Nepal', 'Singapore',
    'Sri Lanka', 'United Arab Emirates (UAE)', 'United Kingdom (UK)', 'United States of America (USA)'
];

export async function GET() {
    try {
        await initializeDb();

        const countResult = await sql`SELECT COUNT(*) FROM master_countries`;
        const count = parseInt(countResult[0].count, 10);

        if (count === 0) {
            for (const country of DEFAULT_COUNTRIES) {
                await sql`
                    INSERT INTO master_countries (name)
                    VALUES (${country})
                    ON CONFLICT DO NOTHING
                `;
            }
        }

        const result = await sql`SELECT name FROM master_countries ORDER BY name ASC`;
        return NextResponse.json(result.map(row => row.name));
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        await initializeDb();
        const { country } = await req.json();
        
        if (!country) {
            return NextResponse.json({ error: 'Country is required' }, { status: 400 });
        }

        // Use case-insensitive comparison using LOWER
        const existing = await sql`
            SELECT name FROM master_countries 
            WHERE LOWER(name) = LOWER(${country.trim()})
            LIMIT 1
        `;

        if (existing.length === 0) {
            await sql`
                INSERT INTO master_countries (name)
                VALUES (${country.trim()})
            `;
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ success: true, message: 'Already exists' });
        }
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
