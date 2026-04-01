export async function lookupBarcode(req, res) {
  const { code } = req.query;
  if (!code) {
    return res.status(400).json({ error: 'code query parameter is required' });
  }

  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json`);
    const data = await response.json();

    if (data.status !== 1 || !data.product) {
      return res.json({ found: false, food: null });
    }

    const p = data.product;
    const nutriments = p.nutriments || {};

    res.json({
      found: true,
      food: {
        name: p.product_name || p.generic_name || 'Unknown Product',
        brand: p.brands || '',
        calories: Math.round(nutriments['energy-kcal_100g'] || nutriments['energy-kcal'] || 0),
        protein: Math.round((nutriments.proteins_100g || 0) * 10) / 10,
        carbs: Math.round((nutriments.carbohydrates_100g || 0) * 10) / 10,
        fat: Math.round((nutriments.fat_100g || 0) * 10) / 10,
        servingSize: p.serving_size || '100g',
        imageUrl: p.image_front_small_url || null,
        per100g: true,
      },
    });
  } catch (err) {
    console.error('lookupBarcode error:', err);
    res.status(500).json({ error: 'Failed to lookup barcode' });
  }
}
