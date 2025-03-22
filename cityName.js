import fs from 'fs';
import path from 'path';

// Function to extract city names from JSON files
function extractCityNames(directory) {
  const cityNames = [];
  const files = fs.readdirSync(directory);

  files.forEach(file => {
    if (path.extname(file) === '.json') {
      const filePath = path.join(directory, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (data.city) {
        cityNames.push(data.city);
      }
    }
  });

  return cityNames;
}

// Function to save city names to a JSON file
function saveCityNamesToFile(cityNames, filename) {
  const data = { cities: cityNames };
  fs.writeFileSync(filename, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`City names saved to ${filename}`);
}

// Main function to orchestrate the process
function main() {
  const directory = '/Users/kerem/Desktop/yemekbot/food-data1';
  const outputFilename = '/Users/kerem/Desktop/yemekbot/cityNames.json';

  const cityNames = extractCityNames(directory);
  saveCityNamesToFile(cityNames, outputFilename);
}

// Run the main function
main();