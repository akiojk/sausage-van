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
export const UBI_USERNAME = '${answers.username}';
export const UBI_PASSWORD = '${answers.password}';
export const UBI_CAR_PLATE = '${answers.carPlate}';
export const UBI_CARPARK = '${answers.carpark}';
export const UBI_WEBSITE_URL = '${answers.websiteUrl}';
export const UBI_LOGIN_URL = \`\${UBI_WEBSITE_URL}/Account/Login?ReturnUrl=%2F\`;
export const UBI_BOOK_URL = \`\${UBI_WEBSITE_URL}/BookNow\`;
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
        StartCalendarInterval: [{
            Hour: parseInt(answers.hour),
            Minute: parseInt(answers.minute),
            Weekday: answers.weekday,
        }],
        WorkingDirectory: process.cwd(),
        StandardErrorPath: `${process.env.PATH}/logs/err.log`,
        StandardOutPath: `${process.env.PATH}/logs/out.log`
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
        message: 'Enter the carpark name:',
        validate: (input) => !!input.trim() || 'Please provide a valid carpark name.',
    },
    {
        type: 'input',
        name: 'websiteUrl',
        message: 'Enter the website URL:',
        validate: (input) => !!input.trim() || 'Please provide a valid website URL.',
    },
    {
        type: 'confirm',
        name: 'preferGroundLevelSpots',
        message: 'Do you prefer ground-level parking spots?',
        default: true,
    },
    { type: 'list', name: 'weekday', message: 'Select the day of the week to run the script:', choices: weekdayOptions },
    {
        type: 'input',
        name: 'hour',
        message: 'Enter the hour of the day to run the script (0-23):',
        validate: (input) => !isNaN(parseInt(input)) && parseInt(input) >= 0 && parseInt(input) <= 23 || 'Please provide a valid hour.',
        transformer: (input) => parseInt(input),
    },
    {
        type: 'input',
        name: 'minute',
        message: 'Enter the minute of the hour to run the script (0-59):',
        validate: (input) => !isNaN(parseInt(input)) && parseInt(input) >= 0 && parseInt(input) <= 59 || 'Please provide a valid minute.',
        transformer: (input) => parseInt(input),
    },
];

(async () => {
    const answers = await inquirer.prompt(questions);
    await createConfigFile(answers);
    await createPlistFile(answers);
    console.log('Configuration and plist file created successfully.');
})();
