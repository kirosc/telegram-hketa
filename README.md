<div align="center">
<h1>
Telegram Bot to Check Hong Kong Public Transport ETA<br>
<br>
<img src="https://raw.githubusercontent.com/kirosc/tg-hketa/master/images/icon_128.png" title="Telegram Bot to Check Hong Kong Public Transport ETA" alt="Icon">
<br>

![GitHub](https://img.shields.io/github/license/kirosc/tg-hketa)
![Build Status](https://github.com/kirosc/telegram-hketa/actions/workflows/main.yml/badge.svg?branch=master)
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fkirosc%2Ftg-hketa.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fkirosc%2Ftg-hketa?ref=badge_shield)
![Monthly User](https://kd1rv712zf.execute-api.ap-east-1.amazonaws.com/monthly-user-count)
[![@HK_ETA_BOT](https://img.shields.io/badge/%F0%9F%92%AC%20Telegram-Bot-blue)](https://t.me/HK_ETA_BOT)

</h1>
</div>

## Introduction

A [**Telegram**](https://telegram.org) bot to check the Hong Kong public transport's estimated time of arrival. Currently support metro, LRT and all franchised buses, including

- MTR(港鐵)
  - Train
  - Bus
  - LRT(輕鐵)
- Citybus(城巴)
- New World First Bus(新巴)
- The Kowloon Motor Bus(九巴)
- Long Win Bus(龍運巴士)
- New Lantao Bus(新大嶼山巴士).

Use this bot [@HK_ETA_BOT](https://t.me/HK_ETA_BOT)

## Planned features

- ETA of Tram(電車)
- Enhance UI
- Error catching
- Testing

## Known bugs

- Please let me know

## Setup

### Environment variables

Eefine a Now Secret to store the Telegram bot API token.

```
now secrets add api_key <secret-value>
```

## Usage

Run locally

```
npm run dev:app
```

Run production

```
npm run build && npm run start
```

## License

[GPL-3.0 ©](./LICENSE)

## Acknowledgement

- [telegraf](https://github.com/telegraf/telegraf) - Modern Telegram Bot Framework for Node.js
- [telegraf-inline-menu](https://github.com/EdJoPaTo/telegraf-inline-menu) - Easily create an inline menu for Telegram bot
- [telegraf-stateless-question](https://github.com/EdJoPaTo/telegraf-stateless-question) - Create stateless questions to Telegram users working in privacy mode
- [axios](https://github.com/axios/axios) - Promise based HTTP client for the browser and node.js
- [express](https://github.com/expressjs/express) - Fast, unopinionated, minimalist web framework for node.
- [DATA.GOV.HK](https://data.gov.hk) - Public sector information.
- [Fly.io](https://fly.io) - Deploy App Servers close to Your Users
