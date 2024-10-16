# polymarket-userscripts
The offered polymarket userscript allows you to conviniently track daily price changes not just of your whole account, but per position you have. The main benefit is being able to track which positions have made most impact on your daily account standing. The daily change will appear in "Latest" column on portfolio page or "Current" column on profile page:
![JustKen profile](https://raw.githubusercontent.com/firedigger/polymarket-userscripts/refs/heads/main/screen.JPG)
The script can be added to [Tampermonkey](https://www.tampermonkey.net) extension for auto-loading, but you can try the script manually without installing anything just by going to the polymarket website and pasting the `polymarket script.js` contents into the console window.
After installing click "Create new script", paste the `polymarket script.js` content into the window and save. The script will activate immediately on profile and portfolio pages.
Now all rows will have price changes. It is written as long as the API returns a value for it. In most cases the absense of value means no change in price since yesterday. At the moment it won't work on "Load more" positions, only first 100 positions are processed.
Contact me at Discord `firedigger`
[ko-fi](https://ko-fi.com/firedigger)