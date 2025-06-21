import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.setHeader('Content-Type', 'application/json').status(405).json({ error: 'Method not allowed' });
    }

    const { userId } = req.body;

    if (!userId) {
        return res.setHeader('Content-Type', 'application/json').status(400).json({ error: 'User ID is required' });
    }

    try {
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (error) {
            throw error;
        }
        return res.setHeader('Content-Type', 'application/json').status(200).json({ success: true });
    } catch (err: unknown) {
        console.error('Error deleting user:', err instanceof Error ? err.message : 'Unknown error');
        return res.setHeader('Content-Type', 'application/json').status(500).json({ error: err instanceof Error ? err.message : 'Failed to delete user account' });
    }
}