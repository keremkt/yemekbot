import puppeteer from 'puppeteer';
import fs from 'fs';
import { log } from 'console';

// Function to launch the browser and create a new page
async function launchBrowser() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  return { browser, page };
}

// Function to navigate to a page
async function navigateToPage(page, url) {
  await page.goto(url);
}

// Function to select an option from a dropdown by value
async function selectOption(page, selector, value) {
  await page.waitForSelector(selector);
  await page.select(selector, value);
}

// Function to wait for content to load (simulating a delay for dynamic content)
async function waitForContentLoad(timeInMs) {
  await new Promise(resolve => setTimeout(resolve, timeInMs));
}

// Function to extract and parse data from elements with specific classes (card, cardStyle)
async function extractDataFromElements(page, classSelector) {
  const mealsData = [];

  const cardData = await page.$$eval(classSelector, elements => 
    elements.map(el => {
      const dateText = el.querySelector('.card-header .date')?.innerText.trim();
      const meals = Array.from(el.querySelectorAll('.card-body p')).map(p => p.innerText.trim());
      const calories = el.querySelector('.card-body .text-end')?.innerText.trim();
      const likeCount = el.querySelector('#likeCount_0')?.innerText.trim() || '0';
      const dislikeCount = el.querySelector('#disLikeCount_0')?.innerText.trim() || '0';
      const commentCount = el.querySelector('#commCount_0')?.innerText.trim() || '0';

      // Split the date into day, month, and day of the week
      const [day, month, year ,dayOfWeek] = dateText.split(' ');

      return {
        day,
        month,
        year,
        dayOfWeek,
        meals: [...meals, calories], // Append calories to meals
        calories,
        likeCount,
        dislikeCount,
        commentCount,
      };
    })
  );

  // Construct the final mealsData array with the desired structure
  cardData.forEach(item => {
    mealsData.push({
      day: item.day,
      month: item.month,
      dayOfWeek: item.dayOfWeek,
      meals: item.meals,
      calories: item.calories,
      likeCount: item.likeCount,
      dislikeCount: item.dislikeCount,
      commentCount: item.commentCount,
    });
  });

  return mealsData;
}

// Function to save data to a JSON file
function saveToJsonFile(data, filename) {
  fs.writeFileSync(filename, JSON.stringify(data, null, 2), 'utf-8');
  
  console.log(`Data saved to ${filename}`);
}

// Function to log all options from a dropdown
async function logDropdownOptions(page, selector) {
  await page.waitForSelector(selector);
  const options = await page.$$eval(`${selector} option`, options => 
    options.map(option => option.textContent.trim())
  );
  console.log('Dropdown options:', options);
  return options;
}

// Main function to orchestrate the process
async function scrapePage() {
  const url = 'https://kykyemek.com/'; // Replace with your target URL
  const selectDropdown = '#navbarDropdown';
  const classSelectors = '.card, .cardStyle'; // Classes to search for
  const outputFilename = 'mealsData.json'; // Name of the output JSON file

  // Launch the browser and open a new page
  const { browser, page } = await launchBrowser();

  try {
    // Navigate to the page
    await navigateToPage(page, url);

    // Log all options from the dropdown and get the list of cities
    const cities = await logDropdownOptions(page, selectDropdown);

    // Initialize an empty array to store all cities' data
    const allCitiesData = [];

    // Iterate through each city and extract data
    for (const city of cities) {
      console.log(`Processing city: ${city}`);

      // Select the city from the dropdown
      await selectOption(page, selectDropdown, city);

      // Wait for the content to load (if dynamic)
      await waitForContentLoad(2000); // Adjust the time as necessary

      // Extract and parse data from the card elements
      const cityData = await extractDataFromElements(page, classSelectors);

      // Add the city data to the allCitiesData array
      allCitiesData.push({
        city,
        data: cityData
      });
    }

    // Save the extracted data to a JSON file
    saveToJsonFile(allCitiesData, outputFilename);
  } catch (error) {
    console.error('Error occurred:', error);
  } finally {
    // Close the browser
    await browser.close();
  }
}

// Run the main function
scrapePage();