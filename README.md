# Telegram Bot to Check Hong Kong Public Transport ETA
![GitHub](https://img.shields.io/github/license/kirosc/tg-hketa) 

## Introduction
A telegram bot to check the Hong Kong public transport's estimated time of arrival. Currently support Citybus(城巴), New World First Bus(新巴) and New Lantao Bus(新大嶼山巴士).


Use this bot [@HK_ETA_BOT](https://t.me/HK_ETA_BOT)
## Setup
### Environment Variables 
Eefine a Now Secret to store the Telegram bot API token.
```
now secrets add api_key <secret-value>
```

## Usage

Run locally
```
npm run dev
```

Deploy to zeit.co
```
npm run prod
```

## License
[GPL-3.0 ©](./LICENSE)

## Acknowledgement
* [telegraf](https://github.com/telegraf/telegraf) - Modern Telegram Bot Framework for Node.js
* [axios](https://github.com/axios/axios) - Promise based HTTP client for the browser and node.js 
* [express](https://github.com/expressjs/express) - Fast, unopinionated, minimalist web framework for node.
* [now](https://github.com/zeit/now) - The easiest way to deploy websites.
* [DATA.GOV.HK](https://data.gov.hk) - Public sector information.