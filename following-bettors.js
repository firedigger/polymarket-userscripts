// ==UserScript==
// @name         Polymarket following bettors
// @namespace    http://tampermonkey.net/
// @version      2024-11-15
// @description  The script shows bets of the bettors you follow on the market page
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

async function getUserPositions(conditions) {
    const url = "https://api.goldsky.com/api/public/project_cl6mb8i9h0003e201j6li0diw/subgraphs/positions-subgraph/0.0.7/gn";
    const query = `
  query {
  userBalances(
    where: {user_in: ${JSON.stringify(bettors.map(b => b.id))}, asset_: {condition_in: ${JSON.stringify(conditions)}}}
  ) {
    user,
    asset{
        condition{
            id
        },
        outcomeIndex
    },
    balance
  }
}
`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
    });
    const data = await response.json();
    if (debug)
        console.log("GraphQL response: ", data);
    return data.data.userBalances.map(b => ({ user: b.user, condition: b.asset.condition.id, balance: Math.floor(b.balance / 1000000), outcomeIndex: b.asset.outcomeIndex })).filter(b => b.balance > 0);
}

const arr_threshold = 0.74;
const debug = true;
const bettors = [{ name: "Donkov", id: "0xbc54e69667ceb6ccec538e5a0ba1927fc1fe680f" }, { id: "0x43ed7d1bf7c703136971ae5e64f6e7feea435535", name: "XiJinPing" }, { id: "0x7c3db723f1d4d8cb9c550095203b686cb11e5c6b", name: "Car" }, { id: "0x24c8cf69a0e0a17eee21f69d29752bfa32e823e1", name: "basedd" }, { id: "0x6139c42e48cf190e67a0a85d492413b499336b7a", name: "RememberAmalek" }];

(async function () {
    'use strict';
    if (debug)
        console.log("STARTING POLYMARKET SCRIPT");
    await observeURL(runScript);
})();

function createTable(data, elem, multi_market) {
    const tableWrapper = document.createElement("div");

    const table = document.createElement("table");

    const thead = document.createElement("thead");

    const headerRow = document.createElement("tr");
    headerRow.style.cssText = `
        padding-left: 1.5rem;
        display: flex;
        width: fit-content;
        max-width: 780px;
    `;

    const headers = ["User"];
    if (multi_market) {
        headers.push("Condition");
    }
    headers.push("Balance", "Outcome");
    headers.forEach((headerText, i) => {
        const th = document.createElement("th");
        th.style.cssText = `
            width: 140px;
            text-align: left;
            padding-top: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid #2C3F4F;
            margin-bottom: 0.5rem;
            position: relative;
            color: #858D92;
            font-weight: 600;
            font-size: 0.625rem;
            line-height: 0.75;
            letter-spacing: 2px;
            text-transform: uppercase;
    `;
        th.textContent = headerText;
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    const cellCSS = `
            padding-top: 10px;
            padding-bottom: 10px;
            margin: 0px;
            font-weight: 400;
            font-size: 0.875rem;
        `;

    data.forEach(item => {
        const row = document.createElement("tr");
        row.style.cssText = `    
        padding-left: 1.5rem;
        display: flex;
        align-items: center;`;

        const userCell = document.createElement("td");
        userCell.style.cssText = cellCSS;
        userCell.style.width = "140px";
        const link = document.createElement("a");
        link.href = `/profile/${item.user}`;
        link.style.textDecoration = "none";
        link.style.color = "#fcfcfc";
        const p = document.createElement("p");
        p.style.margin = "0px";
        p.textContent = item.username;
        link.appendChild(p);
        userCell.appendChild(link);
        row.appendChild(userCell);

        if (multi_market) {
            const conditionCell = document.createElement("td");
            conditionCell.style.cssText = cellCSS;
            conditionCell.style.width = "150px";
            conditionCell.textContent = item.condition;
            row.appendChild(conditionCell);
        }

        const balanceCell = document.createElement("td");
        balanceCell.style.cssText = cellCSS;
        balanceCell.style.width = "150px";
        balanceCell.textContent = item.balance;
        row.appendChild(balanceCell);

        const outcomeCell = document.createElement("td");
        outcomeCell.style.cssText = cellCSS;
        const outcome = document.createElement("div");
        outcome.style.cssText = `
            place-items: center;
            padding: 0.25rem;
            border-radius: 4px;
            font-weight: 500;`;
        outcome.style.color = +item.outcomeIndex === 0 ? "#27AE60" : "#E64800";
        outcome.style.backgroundColor = +item.outcomeIndex === 0 ? "#27AE601A" : "#EB57571A";
        outcome.style.width = "fit-content";
        outcome.textContent = item.outcome;
        outcomeCell.appendChild(outcome);
        row.appendChild(outcomeCell);

        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    tableWrapper.appendChild(table);

    const wrapper = document.createElement("div");

    if (multi_market) {
        wrapper.appendChild(tableWrapper);
    }
    else {
        const headerSection = document.createElement("div");
        headerSection.style.cssText = `
        border: 1px solid #344452;
        border-radius: 8px;
        display: block;
        background-color: #1D2B3;
        color: #ffffff;
        margin-top: 2rem;`

        const headerInner = document.createElement("div");
        headerInner.style.cssText = `padding: 1.25rem 1.5rem 0.25rem;`

        const headerTitle = document.createElement("h1");
        headerTitle.style.cssText = `    
        color: var(--colors-shadeBlack);
        font-family: var(--fonts-sauce);
        font-weight: 600;
        font-size: var(--fontSizes-xxl);
        line-height: var(--lineHeights-xxl);
        margin: 0px;`;
        headerTitle.textContent = "Bettors' positions";
        headerInner.appendChild(headerTitle);
        headerSection.appendChild(headerInner);
        headerSection.appendChild(tableWrapper);
        wrapper.appendChild(headerSection);
    }

    elem.parentNode.insertBefore(wrapper, elem.nextSibling);
}

async function runScript() {
    const url = new URL(window.location.href);
    const pathSegments = url.pathname.split('/');
    if (!pathSegments.includes("event"))
        return;
    const slug = pathSegments[2];
    if (debug)
        console.log("SLUG: ", slug);
    const event = (await (await fetch(`https://gamma-api.polymarket.com/events?slug=${slug}`)).json())[0];
    if (!event) {
        if (debug)
            console.log("Event not found");
        return;
    }
    const markets = event.markets.filter(m => !m.closed);
    if (debug)
        console.log('markets:', markets);
    if (!markets.length)
        return;
    await waitForElement("#__pm_layout > div");
    const positions = await getUserPositions(markets.map(m => m.conditionId));
    if (!positions.length)
        return;
    positions.forEach(p => {
        const market = markets.find(m => m.conditionId === p.condition);
        p.outcome = JSON.parse(market.outcomes)[+p.outcomeIndex];
        p.condition = market.groupItemTitle;
        p.username = bettors.find(b => b.id.toLowerCase() === p.user.toLowerCase())?.name;
    });
    if (debug)
        console.log('positions:', positions);
    const insertAfter = markets.length > 1 ? document.querySelector("#__pm_layout > div > div > div > div:nth-child(3)") : document.querySelector("span.c-hCeiGL").parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.parentNode.previousSibling;
    if (debug)
        console.log("INSERT AFTER: ", insertAfter);
    createTable(positions, insertAfter, markets.length > 1);
    //TODO: Check if can retrieve the avg price
    //Improve styling on multi-market pages
    //Indicate if you are in a challenge with a bettor, add self const
}