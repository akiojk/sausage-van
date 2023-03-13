import puppeteer from 'puppeteer';
import {
  PREFER_GROUND_LEVEL_SPOTS, UBI_BOOK_URL, UBI_CARPARK,
  UBI_CAR_PLATE, UBI_LOGIN_URL, UBI_PASSWORD, UBI_USERNAME
} from
  './config.js';

const getThreeWeeksFromNowLabel = () => {
  const date = new Date();
  date.setDate(new Date().getDate() + 21);
  const d = date.getDate();
  const m = date.getMonth() + 1;
  const y = date.getFullYear();
  return '' + (m <= 9 ? '0' + m : m) + '/' + (d <= 9 ? '0' + d : d) + '/' + y; // mmddyy
}

const waitRandomly = async () => {
  const betweenOneTwoSecs = Math.floor(Math.random() * 2000) + 1000;
  await new Promise(r => setTimeout(r, betweenOneTwoSecs));
}

const clickNonButtonElement = async (page, selector) => {
  const selectorButton = await page.waitForSelector(selector);
  await page.evaluate((element) => element.click(), selectorButton);
}

const clearInput = async (page, selector) => {
  const input = await page.$(selector);
  await input.click({ clickCount: 3 });
  await page.keyboard.press('Backspace');
}

const performLogin = async (page) => {
  console.log('Perform Login ...');

  await page.goto(UBI_LOGIN_URL);

  const emailInput = '#Email';
  const passwordInput = '#Password';

  await page.type(emailInput, UBI_USERNAME);
  await waitRandomly();

  await page.type(passwordInput, UBI_PASSWORD);
  await waitRandomly();

  const loginButton = '.k-primary';
  await page.waitForSelector(loginButton);
  await page.click(loginButton);
  await page.waitForNavigation();
  await waitRandomly();
}

const bookParking = async (page) => {
  console.log('Book Parking ...');
  await page.goto(UBI_BOOK_URL);
  await waitRandomly();

  await clickNonButtonElement(page, 'text/Select Car Park...');
  await waitRandomly();

  await clickNonButtonElement(page, `text/${UBI_CARPARK}`);
  await waitRandomly();

  const datePickerInput = '#FromDatePicker';
  await clearInput(page, datePickerInput);
  await waitRandomly();
  await page.type(datePickerInput, getThreeWeeksFromNowLabel());
  await waitRandomly();

  const licenseInput = '.licensePlate';
  await clearInput(page, licenseInput);
  await waitRandomly();
  await page.type(licenseInput, UBI_CAR_PLATE);
  await waitRandomly();

  const registerButton = '#register-button';
  await page.waitForSelector(registerButton);
  await page.click(registerButton);

  try {
    await waitRandomly();
    const bookingSummary = 'text/Booking Summary';
    await page.waitForSelector(bookingSummary, 5000);
    return true;
  } catch {
    console.log('Car park fully booked.');
    return false;
  }
}

const loopThroughUntilGroundLevel = async (page) => {
  const changeBayButton = 'text/Change Bay';

  for (let retries = 0; retries < 100; retries++) {
    const bayLabel = await page.waitForSelector('#lblBayLabel');
    const bayValue = await bayLabel.evaluate(el => el.textContent);

    console.log(`Retry ${retries} - ${bayValue}`);

    if (bayValue.includes('Ground') && !bayValue.includes('small')) {
      console.log(`Booked ${bayValue}`);
      break;
    }

    const bayError = await page.waitForSelector('#BayError');
    const bayErrorValue = await bayError.evaluate(el => el.textContent);

    if (bayErrorValue === 'No bays available') {
      console.log(`Booked ${bayValue}`);
      break;
    }

    await waitRandomly();
    await page.waitForSelector(changeBayButton);
    await page.click(changeBayButton);
  }
}

const changeBayAndBook = async (page) => {
  console.log('Change Bay and Book ...');

  if (PREFER_GROUND_LEVEL_SPOTS) {
    await loopThroughUntilGroundLevel(page);
  }

  await waitRandomly();
  await page.waitForSelector('text/Book Now');
  await page.click('text/Book Now');
  await page.waitForNavigation();
  await waitRandomly();
}

const finaliseBooking = async (page) => {
  console.log('Finalise Booking ...');
  const bookingInfo = await page.$$('.display-field');
  const bookingInfoTexts = await Promise.all(bookingInfo.map(async (el) => await el.evaluate(el => el.textContent)));
  console.log(bookingInfoTexts.join('\n'));
}

(async () => {
  console.log('Setting up Browser...');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1024, height: 768 });
  await page.setDefaultNavigationTimeout(600000);

  await performLogin(page);
  const shouldContinue = await bookParking(page);
  if (shouldContinue) {
    await changeBayAndBook(page);
    await finaliseBooking(page);
  }

  await browser.close();
})();
