import fs from 'fs';

// Get the JSON data
export function readJSON(fileName: string) {
  try {
    const json = fs.readFileSync(
      `${__dirname}/../../data/${fileName}.json`,
      'utf8'
    );
    return JSON.parse(json);
  } catch (err) {
    console.error('File read failed:', err);
  }
}
