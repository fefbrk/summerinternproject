import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface ContactRecord {
  timestamp?: string;
  [key: string]: unknown;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const filePath = path.join(process.cwd(), 'data', 'contacts.json');
    
    if (!fs.existsSync(filePath)) {
      return res.status(200).json([]);
    }

    const fileContent = fs.readFileSync(filePath, 'utf8');
    if (!fileContent.trim()) {
      return res.status(200).json([]);
    }

    const contacts = JSON.parse(fileContent) as ContactRecord[];
    
    // En yeni mesajları önce göster
    contacts.sort((a, b) => {
      const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return bTime - aTime;
    });

    res.status(200).json(contacts);
  } catch (error) {
    console.error('Error reading contacts:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
