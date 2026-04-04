// UPC-A check digit calculator
function upcCheckDigit(digits) {
  const d = digits.split('').map(Number);
  const sum = d.reduce((s, n, i) => s + n * (i % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10;
}

// Try multiple barcode formats to maximize lookup success
function expandBarcode(raw) {
  const clean = raw.replace(/\s+/g, '');
  const codes = [clean];

  // If 10 digits, try adding leading 0 + check digit (UPC-A from visible print)
  if (clean.length === 10) {
    const padded = '0' + clean;
    codes.push(padded + upcCheckDigit(padded));
  }
  // If 11 digits, try adding check digit
  if (clean.length === 11) {
    codes.push(clean + upcCheckDigit(clean));
  }
  // If 12 digits, also try with leading 0 (EAN-13)
  if (clean.length === 12) {
    codes.push('0' + clean);
  }

  return [...new Set(codes)];
}

export async function lookupBarcode(req, res) {
  const { code } = req.query;
  if (!code) {
    return res.status(400).json({ error: 'code query parameter is required' });
  }

  try {
    const candidates = expandBarcode(code);

    let product = null;
    for (const c of candidates) {
      const response = await fetch(`https://world.openfoodfacts.net/api/v2/product/${c}.json`);
      const data = await response.json();
      if (data.status === 1 && data.product) {
        product = data.product;
        break;
      }
    }

    if (!product) {
      return res.json({ found: false, food: null });
    }

    const n = product.nutriments || {};
    const servingG = parseFloat(product.serving_quantity) || 0;
    const hasServing = servingG > 0 && n['energy-kcal_serving'] != null;

    res.json({
      found: true,
      food: {
        name: product.product_name || product.generic_name || 'Unknown Product',
        brand: product.brands || '',
        calories: Math.round(hasServing ? n['energy-kcal_serving'] : (n['energy-kcal_100g'] || 0)),
        protein: Math.round((hasServing ? (n.proteins_serving || 0) : (n.proteins_100g || 0)) * 10) / 10,
        carbs: Math.round((hasServing ? (n.carbohydrates_serving || 0) : (n.carbohydrates_100g || 0)) * 10) / 10,
        fat: Math.round((hasServing ? (n.fat_serving || 0) : (n.fat_100g || 0)) * 10) / 10,
        servingSize: product.serving_size || (servingG > 0 ? `${Math.round(servingG)}g` : '100g'),
        imageUrl: product.image_front_small_url || null,
      },
    });
  } catch (err) {
    console.error('lookupBarcode error:', err);
    res.status(500).json({ error: 'Failed to lookup barcode' });
  }
}
