# Sausage Van 🌭
Runs on Mac at scheduled time three weeks ahead so you can snooze 💤

## Installation
1. Clone this repo to your local directory
2. Install [**pnpm**](https://pnpm.io/installation)
3. Go to your local directory from Step 1, run `pnpm config:setup`
4. Follow the instructions to type in all necessary information
    1. Car plate number must *exactly* match the one registered on the car park website, e.g. ABC123
	2. Car park name must *exactly* match the names from carpark selector on the carpark website
    3. Booking website URL must start with `https://` and include domain only, e.g. `https://companyname.parkingwebsite.com`
5. Once finished, **log out** as current user or **reboot** your Mac to take effect

## Try run
You may schedule the booking in a few minutes time to see if your configuration works. Logs will be written at `logs` folder. If anything check out `err.log` or `out.log`.

## Disable
Run `pnpm config:remove` to have the schedule removed from your system.

---
## Troubleshoot
1. You may check out `config.js` to see if your details are correct.
2. You may run `pnpm start` to see if you are able to make a booking.