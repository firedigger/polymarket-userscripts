// ==UserScript==
// @name         Polymarket position daily change
// @namespace    http://tampermonkey.net/
// @version      2024-10-16
// @description  The script ammends profile and portfolio change with daily change in the position price from the Polymarket API
// @author       Aleksandr Makarov
// @license      Unlicense
// @downloadURL  https://raw.githubusercontent.com/firedigger/polymarket-userscripts/refs/heads/main/polymarket%20script.js
// @updateURL    https://raw.githubusercontent.com/firedigger/polymarket-userscripts/refs/heads/main/polymarket%20script.js
// @match        https://polymarket.com/*
// @icon         https://polymarket.com/icons/favicon-32x32.png
// @grant        none
// ==/UserScript==

const debug = false;

function waitForElement(selector) {
    return new Promise((resolve) => {
        const observer = new MutationObserver((mutations, observerInstance) => {
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

async function getPositionsWithMarkets(user_id) {
    const positionsResponse = await fetch(`https://data-api.polymarket.com/positions?user=${user_id}`);
    const positions = await positionsResponse.json();
    const conditionIds = positions.map(p => p.conditionId).slice(0, 100);
    const params = new URLSearchParams();
    conditionIds.forEach(id => params.append('condition_ids', id));
    const marketsResponse = await fetch(`https://gamma-api.polymarket.com/markets?${params}`);
    const markets = await marketsResponse.json();
    return positions.map(p => {
        const market = markets.find(m => m.conditionId === p.conditionId);
        return { ...p, market };
    }).filter(p => p.market).map(p => {
        const firstOutcome = JSON.parse(p.market.outcomes)[0];
        const newPrice = p.outcome === firstOutcome ? p.market.bestAsk : 1 - p.market.bestBid;
        const priceReduced = p.market.oneDayPriceChange && ((p.outcome === firstOutcome) === (p.market.oneDayPriceChange < 0));
        return { ...p, newPrice, priceReduced };
    });
}

async function runScript() {
    const url = new URL(window.location.href);
    const pathSegments = url.pathname.split('/');
    if (debug)
        console.log("CHECKING POLYMARKET SCRIPT");
    if (!pathSegments.includes('profile') && !pathSegments.includes('portfolio'))
        return;
    const isProfile = pathSegments.includes('profile');
    if (debug)
        console.log("WAITING FOR ELEMENT");
    await waitForElement("[id$='-content-positions'] > div > div > div:nth-child(2) > div > div > div > div");
    if (debug)
        console.log("STARTING TAMPER MONKEY JOB");
    let user_id;
    if (isProfile)
        user_id = pathSegments[pathSegments.indexOf('profile') + 1];
    else {
        const polyClobApiKeyMap = localStorage.getItem('poly_clob_api_key_map');
        if (!polyClobApiKeyMap)
            return;
        user_id = Object.keys(JSON.parse(polyClobApiKeyMap))[0];
    }
    if (!user_id)
        return;
    const table = document.querySelector("[id$='-content-positions'] > div > div > div:nth-child(2)");
    if (!table) {
        if (debug)
            console.log("Table not found");
        return;
    }
    if (debug)
        console.log("Table found");
    const positionWithMarkets = await getPositionsWithMarkets(user_id);
    const divChildren = Array.from(table.children);
    if (debug)
        console.log(`Processing ${divChildren.length} rows`);
    divChildren.forEach(child => {
        const col = isProfile ? child.querySelector("div > div:nth-child(3)") : child.querySelector("div > div > p").parentElement;
        const hrefDiv = child.querySelector("div[href]");
        if (!hrefDiv || !hrefDiv.attributes || !hrefDiv.attributes["href"])
            return;
        const href = hrefDiv.attributes["href"].value.replace(/^\/market\//, '');
        const position = positionWithMarkets.find(p => p.market.slug === href);
        if (!position || !position.market.oneDayPriceChange)
            return;
        const change = position.market.oneDayPriceChange * 100 * (position.priceReduced ? 1 : -1);
        if (Math.abs(change) < 0.1)
            return;
        col.style.flexDirection = "column";
        col.style.alignItems = "flex-start";
        col.innerHTML += `<p style="line-height: 1; font-weight: 500 !important; letter-spacing: 0; margin: 0; font-size: 0.75rem; color: ${change < 0 ? '#E64800' : 'green'};">${change > 0 ? '+' : ''}${change.toFixed(1)}¢</p>`;
    });
}

const observeDOM = (fn, e = document.documentElement, config = { attributes: 1, childList: 1, subtree: 1 }) => {
    const observer = new MutationObserver(fn);
    observer.observe(e, config);
    return () => observer.disconnect();
};

(async function () {
    'use strict';
    if (debug)
        console.log("STARTING POLYMARKET SCRIPT");
    await runScript();
    let url = window.location.href;
    observeDOM(() => {
        if (window.location.href !== url) {
            if (debug)
                console.log("URL CHANGED");
            url = window.location.href;
            runScript();
        }
    });

})();