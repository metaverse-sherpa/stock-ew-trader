export const validateStock = async (symbol: string) => {
  const response = await fetch('/api/validateStock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol }),
  });

  if (!response.ok) {
    throw new Error('Failed to validate stock');
  }

  return response.json();
}; 