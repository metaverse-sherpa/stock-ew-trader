import { NextApiRequest, NextApiResponse } from 'next'; 
import { exec } from 'child_process';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Run the updateStockData script
    exec('ts-node scripts/updateStockData.ts', (error, stdout, stderr) => {
      if (error) {
        console.error('Error running script:', error);
        return res.status(500).json({ message: 'Failed to update stock data' });
      }

      console.log('Script output:', stdout);
      res.status(200).json({ message: 'Stock data updated successfully' });
    });
  } catch (error) {
    console.error('Error updating stock data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 