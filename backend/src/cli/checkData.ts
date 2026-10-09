import fs from 'fs';
import path from 'path';

export async function checkData(): Promise<void> {
  const schemesDir = path.resolve(__dirname, '../../../data/schemes');

  console.log('[Data Check] Validating scheme datasets...');

  if (!fs.existsSync(schemesDir)) {
    console.log('[Data Check] Directory data/schemes does not exist yet. 0 scheme files verified.');
    return;
  }

  const files = fs.readdirSync(schemesDir).filter((file) => file.endsWith('.json'));

  if (files.length === 0) {
    console.log('[Data Check] No scheme JSON files found in data/schemes. 0 scheme files verified.');
    return;
  }

  let errorCount = 0;
  for (const file of files) {
    const filePath = path.join(schemesDir, file);
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const json = JSON.parse(content);

      if (!json.slug || !json.title || !json.type || !json.authority) {
        console.error(`[Data Check] Error in ${file}: missing required fields (slug, title, type, authority)`);
        errorCount++;
      }
    } catch (err) {
      console.error(`[Data Check] Syntax error in ${file}:`, err instanceof Error ? err.message : err);
      errorCount++;
    }
  }

  if (errorCount > 0) {
    throw new Error(`[Data Check] Validation failed with ${errorCount} error(s).`);
  }

  console.log(`[Data Check] Successfully verified ${files.length} scheme file(s).`);
}

if (require.main === module) {
  checkData()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
