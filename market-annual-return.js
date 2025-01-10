// ==UserScript==
// @name         Polymarket market annual return
// @namespace    http://tampermonkey.net/
// @version      2024-10-18
// @description  The script calculates the annual return rate for the probable outcome of the market and displays it on the page
// @author       Aleksandr Makarov
// @license      Unlicense
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
    let url = new URL(window.location.href).pathname;
    observeDOM(() => {
        const newURL = new URL(window.location.href).pathname;
        if (newURL !== url) {
            if (debug)
                console.log("URL CHANGED");
            url = newURL;
            fn();
        }
    });
};

const arr_threshold = 0.74;
const debug = false;

(async function () {
    'use strict';
    if (debug)
        console.log("STARTING POLYMARKET SCRIPT");
    await observeURL(runScript);
})();

function calculatePartOfTheYear(deadline) {
    return Math.max(deadline.getTime() - Date.now(), 24 * 60 * 60 * 1000) / (Date.UTC(deadline.getUTCFullYear() + 1, 0, 1) - Date.UTC(deadline.getUTCFullYear(), 0, 1));
}

async function runScript() {
    const url = new URL(window.location.href);
    const pathSegments = url.pathname.split('/');
    if (!pathSegments.includes("event"))
        return;
    const selector = "#event-detail-container > div > div > div:nth-child(2) > div";
    await waitForElement(selector);
    const slug = pathSegments[2];
    if (debug)
        console.log("SLUG: ", slug);
    const event = (await (await fetch(`https://gamma-api.polymarket.com/events?slug=${slug}`)).json())[0];
    if (!event) {
        if (debug)
            console.log("Event not found");
        return;
    }
    const markets = event.markets.filter(m => !m.closed && m.bestAsk > 0.01);
    if (debug)
        console.log('markets:', markets);
    if (!markets.length)
        return;
    if (markets.length > 2) {
        const selector = document.querySelectorAll("div[data-state] > button[id]");
        if (markets.some(m => m.negRisk)) {
            if (debug)
                console.log("Negative risk found");
            let counter = 0;
            //TODO: add button to change the mode?
            //go from most probable to 2 directions?
            const negThreshold = 1; //disable neg risk for now
            const touched = new Set();
            Array.from(selector).forEach(row => {
                const cell = row.querySelector("div > div > div");
                const groupItemTitle = cell.querySelector("p").innerHTML;
                const market = markets.find(m => m.groupItemTitle == groupItemTitle);
                if (!market)
                    return;
                counter += market.bestAsk;
                if (counter < negThreshold || counter >= 1)
                    return;
                touched.add(row);
                const annualizedProfit = (1 / counter - 1) / calculatePartOfTheYear(new Date(market.endDate)) * 100;
                const elem = cell.lastChild;
                elem.innerHTML += `<p>${counter.toPrecision(3)}(${Math.floor(annualizedProfit)}% APR)</p>`;
            });
            counter = 0;
            Array.from(selector).reverse().forEach(row => {
                const cell = row.querySelector("div > div > div");
                const groupItemTitle = cell.querySelector("p").innerHTML;
                const market = markets.find(m => m.groupItemTitle == groupItemTitle);
                if (!market)
                    return;
                counter += market.bestBid;
                if (counter < negThreshold || counter >= 1)
                    return;
                touched.add(row);
                const annualizedProfit = (1 / counter - 1) / calculatePartOfTheYear(new Date(market.endDate)) * 100;
                const elem = cell.lastChild;
                elem.innerHTML += `<p style="color: #E64800;">${counter.toPrecision(3)}(${Math.floor(annualizedProfit)}% APR)</p>`;
            });
            Array.from(selector).forEach(row => {
                const cell = row.querySelector("div > div > div");
                const groupItemTitle = cell.querySelector("p").innerHTML;
                const market = markets.find(m => m.groupItemTitle == groupItemTitle);
                if (!market)
                    return;
                if (touched.has(row))
                    return;
                const annualizedProfit = (1 / Math.max(market.bestAsk, 1 - market.bestBid) - 1) / calculatePartOfTheYear(new Date(market.endDate)) * 100;
                const elem = cell.lastChild;
                elem.innerHTML += `<p>${Math.floor(annualizedProfit)}% APR</p>`;
            });
        }
        else
            Array.from(selector).forEach(row => {
                const cell = row.querySelector("div > div > div");
                const groupItemTitle = cell.querySelector("p").innerHTML;
                const market = markets.find(m => m.groupItemTitle == groupItemTitle);
                if (!market)
                    return;
                const annualizedProfit = (1 / Math.max(market.bestAsk, 1 - market.bestBid) - 1) / calculatePartOfTheYear(new Date(market.endDate)) * 100;
                const elem = cell.lastChild;
                elem.innerHTML += `<p>${Math.floor(annualizedProfit)}% APR</p>`;
            });
    }
    else {
        const annualizedProfit = (1 / Math.min(...markets.map(m => Math.max(m.bestAsk, 1 - m.bestBid))) - 1) / calculatePartOfTheYear(new Date(Math.min(...markets.map(m => new Date(m.endDate))))) * 100;
        const elem = document.querySelector(selector);
        if (!elem) {
            if (debug)
                console.log("Element not found");
            return;
        }
        let text = Math.floor(annualizedProfit) + "% APR";
        const partOftheYear = calculatePartOfTheYear(new Date(Math.min(...markets.map(m => new Date(m.endDate)))));
        const minAsk = 1 / (1 + arr_threshold * partOftheYear);
        const verb = annualizedProfit < arr_threshold * 100 ? "get" : "sell at";
        text += ` (${verb} ${(minAsk * 100).toFixed(1)}¢)`;
        elem.innerHTML += `<p style="color: #858D92; font-size: 0.875rem; line-height: 1.2; font-weight: 400 !important; margin: 0">${text}</p>`;
    }
}