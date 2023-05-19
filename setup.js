import fs from 'fs';
import inquirer from 'inquirer';
import plist from 'plist';
import process from 'process';
import { exec } from 'child_process';

const configPath = './config.js';
const plistPath = `${process.env.HOME}/Library/LaunchAgents/io.ak.parking.book.plist`;

const getNodePath = () => {
    return new Promise((resolve, reject) => {
        exec('which node', (error, stdout) => {
            if (error) {
                reject(error);
            } else {
                resolve(stdout.trim());
            }
        });
    });
};

const createConfigFile = async (answers) => {
    const content = `
export const PREFER_GROUND_LEVEL_SPOTS = ${answers.preferGroundLevelSpots};
export const SAUSAGE_VAN_USERNAME = '${answers.username}';
export const SAUSAGE_VAN_PASSWORD = '${answers.password}';
export const SAUSAGE_VAN_CAR_PLATE = '${answers.carPlate}';
export const SAUSAGE_VAN_CARPARK = '${answers.carpark}';
export const SAUSAGE_VAN_WEBSITE_URL = '${answers.websiteUrl}';
export const SAUSAGE_VAN_LOGIN_URL = \`\${SAUSAGE_VAN_WEBSITE_URL}/Account/Login?ReturnUrl=%2F\`;
export const SAUSAGE_VAN_BOOK_URL = \`\${SAUSAGE_VAN_WEBSITE_URL}/BookNow\`;
`;

    fs.writeFileSync(configPath, content);
};

const createPlistFile = async (answers) => {
    const nodePath = await getNodePath();
    const plistObject = {
        EnvironmentVariables: {
            PATH: process.env.PATH,
        },
        Label: 'io.ak.parking.book',
        ProgramArguments: [
            nodePath,
            `${process.cwd()}/carpark.js`
        ],
        RunAtLoad: false,
        StartCalendarInterval: answers.weekdays.map((weekday) => ({
            Hour: parseInt(answers.hour),
            Minute: parseInt(answers.minute),
            Weekday: weekday,
        })),
        WorkingDirectory: process.cwd(),
        StandardErrorPath: `${process.cwd()}/logs/err.log`,
        StandardOutPath: `${process.cwd()}/logs/out.log`
    };

    const content = plist.build(plistObject);
    fs.writeFileSync(plistPath, content);
};

const weekdayOptions = [
    { name: 'Sunday', value: 0 },
    { name: 'Monday', value: 1 },
    { name: 'Tuesday', value: 2 },
    { name: 'Wednesday', value: 3 },
    { name: 'Thursday', value: 4 },
    { name: 'Friday', value: 5 },
    { name: 'Saturday', value: 6 },
];

const questions = [
    {
        type: 'input',
        name: 'username',
        message: 'Enter your username:',
        validate: (input) => !!input.trim() || 'Please provide a valid username.',
    },
    {
        type: 'password',
        name: 'password',
        message: 'Enter your password:',
        validate: (input) => !!input.trim() || 'Please provide a valid password.',
    },
    {
        type: 'input',
        name: 'carPlate',
        message: 'Enter your car plate number:',
        validate: (input) => !!input.trim() || 'Please provide a valid car plate number.',
    },
    {
        type: 'input',
        name: 'carpark',
        message: 'Enter the carpark name (exact name):',
        validate: (input) => !!input.trim() || 'Please provide a valid carpark name.',
    },
    {
        type: 'input',
        name: 'websiteUrl',
        message: 'Enter the booking website URL (starting with https):',
        validate: (input) => {
            const urlRegex = /^(https):\/\/[^ "]+$/;
            if (!urlRegex.test(input.trim())) {
                return 'Please provide a valid website URL.';
            }
            return true;
        },
        filter: (input) => input.trim().replace(/\/$/, ''),
    },
    {
        type: 'confirm',
        name: 'preferGroundLevelSpots',
        message: 'Do you prefer ground-level parking spots?',
        default: true,
    },
    { type: 'checkbox', name: 'weekdays', message: 'Select the day of the week to run the script:', choices: weekdayOptions },
    {
        type: 'input',
        name: 'hour',
        message: 'Enter the hour of the day to run the script (0-23):',
        validate: (input) => !isNaN(parseInt(input)) && parseInt(input) >= 0 && parseInt(input) <= 23 || 'Please provide a valid hour.',
        transformer: (input) => input.trim().length > 0 ? parseInt(input) : '',
        default: '0',
    },
    {
        type: 'input',
        name: 'minute',
        message: 'Enter the minute of the hour to run the script (0-59):',
        validate: (input) => !isNaN(parseInt(input)) && parseInt(input) >= 0 && parseInt(input) <= 59 || 'Please provide a valid minute.',
        transformer: (input) => input.trim().length > 0 ? parseInt(input) : '',
        default: '10',
    },
];

(async () => {
    console.log(`\n\n\n----------------------------------------------------------------`);
    console.log('🅿️  Welcome to the Sausage Van 🌭 Carpark Booking Setup Wizard 🅿️');
    console.log('----------------------------------------------------------------\n\n');
    const answers = await inquirer.prompt(questions);
    await createConfigFile(answers);
    await createPlistFile(answers);
    console.log('Task scheduled. Please log out (or reboot) and log back in to enable the task.');
})();
