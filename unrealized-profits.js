// ==UserScript==
// @name         Polymarket unrealized profits calculator
// @namespace    http://tampermonkey.net/
// @version      2024-10-19
// @description  The script ammends profile profit with unrealized profits figure and profile portfolio with portfolio MLE value
// @author       Aleksandr Makarov
// @license      Unlicense
// @downloadURL  https://raw.githubusercontent.com/firedigger/polymarket-userscripts/refs/heads/main/unrealized-profits.js
// @updateURL    https://raw.githubusercontent.com/firedigger/polymarket-userscripts/refs/heads/main/unrealized-profits.js
// @match        https://polymarket.com/*
// @icon         https://polymarket.com/icons/favicon-32x32.png
// @grant        none
// ==/UserScript==

function waitForElement(selector) {
    if (document.querySelector(selector))
        return Promise.resolve();
    return new Promise((resolve) => {
        const observer = new MutationObserver((_, observerInstance) => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observerInstance.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

const observeDOM = (fn, e = document.documentElement, config = { attributes: 1, childList: 1, subtree: 1 }) => {
    const observer = new MutationObserver(fn);
    observer.observe(e, config);
    return () => observer.disconnect();
};

const observeURL = async (fn) => {
    await fn();
    let url = window.location.href;
    observeDOM(() => {
        if (window.location.href !== url) {
            if (debug)
                console.log("URL CHANGED");
            url = window.location.href;
            fn();
        }
    });
};

const debug = false;

(async function () {
    'use strict';
    if (debug)
        console.log("STARTING POLYMARKET SCRIPT");
    await observeURL(runScript);
})();

async function runScript() {
    const url = new URL(window.location.href);
    const pathSegments = url.pathname.split('/');
    if (debug)
        console.log("CHECKING POLYMARKET SCRIPT");
    if (!pathSegments.includes('profile'))
        return;
    if (debug)
        console.log("WAITING FOR ELEMENT");
    const selector = "#__pm_layout > div > div:nth-child(3) > div:nth-child(2)";
    await waitForElement(selector);
    await new Promise(r => setTimeout(r, 850));
    if (debug)
        console.log("STARTING TAMPER MONKEY JOB");
    const user_id = pathSegments[pathSegments.indexOf('profile') + 1];
    if (!user_id)
        return;
    const positionsResponse = await fetch(`https://data-api.polymarket.com/positions?user=${user_id}`);
    const positions = await positionsResponse.json();
    const unrealizedProfit = positions.reduce((acc, p) => acc + p.cashPnl, 0);
    //const profit = (await (await fetch(`https://lb-api.polymarket.com/profit?window=all&limit=1&address=${user_id}`)).json()).amount;
    const numberFormatter = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    const existingUnrealizedProfitsCell = document.querySelector("#unrealized-profits");
    const unrealizedProfitString = unrealizedProfit < 0
        ? `(-$${numberFormatter.format(Math.abs(unrealizedProfit))})`
        : `($${numberFormatter.format(unrealizedProfit)})`;
    if (existingUnrealizedProfitsCell) {
        existingUnrealizedProfitsCell.innerHTML = unrealizedProfitString;
    }
    else {
        (document.querySelector(selector)).innerHTML += `<p id="unrealized-profits" style="margin: 0">${unrealizedProfitString}</p>`;
    }
    const portfolioSelector = "#__pm_layout > div > div:nth-child(3) > div:nth-child(1)";
    const portfolioMLE = positions.reduce((acc, p) => acc + (p.curPrice > 0.5 ? p.size : 0), 0);
    const existingPortfolioMLE = document.querySelector("#portfolio-mle");
    const portfolioMLEString = `($${numberFormatter.format(portfolioMLE)})`;
    if (existingPortfolioMLE) {
        existingPortfolioMLE.innerHTML = portfolioMLEString;
    }
    else {
        (document.querySelector(portfolioSelector)).innerHTML += `<p id="portfolio-mle" style="margin: 0">${portfolioMLEString}</p>`;
    }
    const volumeSelector = "#__pm_layout > div > div:nth-child(3) > div:nth-child(3)";
    const volume = positions.reduce((acc, p) => acc + p.initialValue, 0);
    const existingVolume = document.querySelector("#volume");
    const volumeString = `($${numberFormatter.format(volume)})`;
    if (existingVolume) {
        existingVolume.innerHTML = volumeString;
    }
    else {
        (document.querySelector(volumeSelector)).innerHTML += `<p id="volume" style="margin: 0">${volumeString}</p>`;
    }
    const marketsSelector = "#__pm_layout > div > div:nth-child(3) > div:nth-child(4)";
    const markets = positions.length;
    const existingMarkets = document.querySelector("#markets");
    if (existingMarkets) {
        existingMarkets.innerHTML = markets;
    }
    else {
        (document.querySelector(marketsSelector)).innerHTML += `<p id="markets" style="margin: 0">(${markets})</p>`;
    }
}