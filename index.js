import puppeteer from  'puppeteer'


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

// Function to extract elements with specific classes (card, cardStyle)
async function getElementsWithClass(page, classSelector) {
  return await page.$$eval(classSelector, elements => 
    elements.map(el => el.outerHTML) // Extract and return the outerHTML of each element
  );
}

// Main function to orchestrate the process
async function scrapePage() {
  const url = 'https://kykyemek.com/'; // Replace with your target URL
  const selectDropdown = '#navbarDropdown';
  const optionValue = 'Ankara';
  const classSelectors = '.card, .cardStyle'; // Classes to search for

  // Launch the browser and open a new page
  const { browser, page } = await launchBrowser();

  try {
    // Navigate to the page
    await navigateToPage(page, url);

    // Select the "Ankara" option from the dropdown
    await selectOption(page, selectDropdown, optionValue);

    // Wait for the content to load (if dynamic)
    await waitForContentLoad(2000); // Adjust the time as necessary

    // Get div elements with classes "card" and "cardStyle"
    const cardElements = await getElementsWithClass(page, classSelectors);

    // Log the card elements' HTML
    console.log(cardElements);
  } catch (error) {
    console.error('Error occurred:', error);
  } finally {
    // Close the browser
    await browser.close();
  }
}

// Run the main function
scrapePage();
