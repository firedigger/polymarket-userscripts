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
    return data.data.userBalances.map(b => ({ user: b.user, condition: b.asset.condition.id, balance: Math.floor(b.balance / 1000000), outcomeIndex: b.asset.outcomeIndex })).filter(b => b.balance > 0);
}

const arr_threshold = 0.74;
const debug = true;
const bettors = [{ name: "Donkov", id: "0xbc54e69667ceb6ccec538e5a0ba1927fc1fe680f" }, { id: "0x43ed7d1bf7c703136971ae5e64f6e7feea435535", name: "XiJinPing" }, { id: "0x7c3db723f1d4d8cb9c550095203b686cb11e5c6b", name: "Car" }, { id: "0x24c8cf69a0e0a17eee21f69d29752bfa32e823e1", name: "basedd" }];
//const bettors = [{ id: "0xbcba8bae2e66da40fdc18c80064b06cf4f124573", name: "firedigger" }];

(async function () {
    'use strict';
    if (debug)
        console.log("STARTING POLYMARKET SCRIPT");
    await observeURL(runScript);
})();

function calculatePartOfTheYear(deadline) {
    return Math.max(deadline.getTime() - Date.now(), 24 * 60 * 60 * 1000) / (Date.UTC(deadline.getUTCFullYear() + 1, 0, 1) - Date.UTC(deadline.getUTCFullYear(), 0, 1));
}

function createTable(data, elem, condition_column) {
    const tableWrapper = document.createElement("div");
    tableWrapper.classList.add("c-PJLV", "c-PJLV-igOOgQP-css");

    const table = document.createElement("table");
    table.classList.add("c-koEcjF", "c-koEcjF-iidwXuV-css");

    const thead = document.createElement("thead");
    thead.classList.add("c-LzPBZ");

    const headerRow = document.createElement("tr");
    headerRow.classList.add("c-bVbKdS", "c-bVbKdS-ietvMDX-css");

    const headers = ["User"];
    if (condition_column) {
        headers.push("Condition");
    }
    headers.push("Balance", "Outcome");
    headers.forEach(headerText => {
        const th = document.createElement("th");
        th.classList.add(
            "c-iFnLRI",
            "c-iFnLRI-fDDYM-variant-secondary",
            `c-iFnLRI-ijyDTxN-css`
        );
        th.textContent = headerText;
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    tbody.classList.add("c-fDAkXO");

    data.forEach(item => {
        const row = document.createElement("tr");
        row.classList.add("c-bVbKdS", "c-bVbKdS-ihoZIKi-css");

        const userCell = document.createElement("td");
        userCell.classList.add("c-hzTKhM", "c-hzTKhM-ieIMQng-css");
        userCell.textContent = item.user;
        row.appendChild(userCell);

        if (condition_column) {
            const conditionCell = document.createElement("td");
            conditionCell.classList.add("c-hzTKhM", "c-hzTKhM-ieIMQng-css");
            conditionCell.textContent = item.condition;
            row.appendChild(conditionCell);
        }

        const balanceCell = document.createElement("td");
        balanceCell.classList.add("c-hzTKhM", "c-hzTKhM-iiJtODN-css");
        balanceCell.textContent = item.balance;
        row.appendChild(balanceCell);

        const outcomeCell = document.createElement("td");
        outcomeCell.classList.add("c-hzTKhM", "c-hzTKhM-ieIMQng-css");
        outcomeCell.textContent = item.outcomeIndex === 0 ? "No" : "Yes";
        row.appendChild(outcomeCell);

        tbody.appendChild(row);
    });

    table.appendChild(tbody);
    tableWrapper.appendChild(table);

    const wrapper = document.createElement("div");
    wrapper.classList.add("c-hakyQ");

    const headerSection = document.createElement("div");
    headerSection.classList.add(
        "c-dhzjXW",
        "c-dhzjXW-iMOHGa-variant-primary",
        "c-dhzjXW-ijtQBXH-css"
    );

    const headerInner = document.createElement("div");
    headerInner.classList.add("c-fixGjY", "c-fixGjY-ilivHLI-css");

    const headerTitle = document.createElement("h1");
    headerTitle.classList.add(
        "c-iFnLRI",
        "c-iFnLRI-eHbKxH-variant-primary"
    );
    headerTitle.textContent = "Bettor's positions";

    headerInner.appendChild(headerTitle);
    headerSection.appendChild(headerInner);
    headerSection.appendChild(tableWrapper);
    wrapper.appendChild(headerSection);

    elem.parentNode.insertBefore(wrapper, elem);
}

async function runScript() {
    const url = new URL(window.location.href);
    const pathSegments = url.pathname.split('/');
    if (!pathSegments.includes("event"))
        return;
    const selector = "#__pm_layout > div > div.c-dhzjXW.c-dhzjXW-ihMJgLI-css > div > div:nth-child(3) > div > div:nth-child(3)";
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
    const markets = event.markets.filter(m => !m.closed);
    if (debug)
        console.log('markets:', markets);
    if (!markets.length)
        return;
    const positions = await getUserPositions(markets.map(m => m.conditionId));
    if (!positions.length)
        return;
    positions.forEach(p => {
        const market = markets.find(m => m.conditionId === p.condition);
        p.outcomeIndex = JSON.parse(market.outcomes)[p.outcomeIndex - 1].name;
        p.condition = market.groupItemTitle;
        p.user = bettors.find(b => b.id.toLowerCase() === p.user.toLowerCase())?.name;
    });
    if (debug)
        console.log('positions:', positions);
    createTable(positions, document.querySelector(selector));
    //TODO: verify styling
    //Check if can find the avg price
    //Update Readme
}