import puppeteer from 'puppeteer';
import fs from 'fs';
import { setTimeout } from 'node:timers/promises';
import path from 'path';

// Function to launch the browser
async function launchBrowser() {
  const browser = await puppeteer.launch({ headless: true }); // Set headless: false to see the browser
  const page = await browser.newPage();
  return { browser, page };
}

// Function to navigate to the target URL
async function navigateToPage(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
}

// Function to select an option from a dropdown
async function selectOption(page, selectSelector, optionValue) {
  await page.select(selectSelector, optionValue);
}

// Function to check if the dinner checkbox is checked
async function isDinnerChecked(page) {
  const isChecked = await page.$eval('#checkboxitem', checkbox => checkbox.checked);
  return isChecked;
}

// Function to extract and parse data from elements with specific classes
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
      const [day, month, dayOfWeek] = dateText.split(' ');

      return {
        day,
        month,
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
  const dir = path.dirname(filename);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
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

  // Launch the browser and open a new page
  const { browser, page } = await launchBrowser();

  try {
    // Navigate to the page
    await navigateToPage(page, url);

    // Log all options from the dropdown and get the list of cities
    const cities = await logDropdownOptions(page, selectDropdown);

    // Iterate through each city and extract data
    for (const city of cities) {
      console.log(`Processing city: ${city}`);

      // Select the city from the dropdown
      await selectOption(page, selectDropdown, city);

      // Wait for the content to load (if dynamic)
      await setTimeout(2000); // Adjust the time as necessary

      // Extract and parse breakfast data from the card elements
      const breakfastData = await extractDataFromElements(page, classSelectors);

      // Check if the dinner checkbox is checked
      let dinnerChecked = await isDinnerChecked(page);

      if (!dinnerChecked) {
        // Click the checkbox to check it
        await page.evaluate(() => {
          document.querySelector("#checkboxitem").parentElement.click();
        });

        // Wait for a moment to ensure the checkbox state is updated
        await setTimeout(500);
      }

      // Re-check if the dinner checkbox is now checked
      dinnerChecked = await isDinnerChecked(page);

      let dinnerData = [];
      if (dinnerChecked) {
        // Extract and parse dinner data from the card elements
        dinnerData = await extractDataFromElements(page, classSelectors);
      } else {
        console.log('Dinner checkbox could not be checked. No dinner data will be extracted.');
      }

      // Save the city data to a separate JSON file
      const cityData = {
        city,
        breakfastData,
        dinnerData
      };
      const outputFilename = `food-data1/${city}.json`;
      saveToJsonFile(cityData, outputFilename);
    }
  } catch (error) {
    console.error('Error occurred:', error);
  } finally {
    // Close the browser
    await browser.close();
  }
}

// Run the main function
scrapePage();