# polymarket-userscripts
After actively using polymarket for some time I decided to introduce a couple of UI features I would like the platform to have. I have implemented them as userscripts integrated via [Tampermonkey](https://www.tampermonkey.net). Feel free to explore if they could be useful for you. The open source nature of the code is a guarantee of security of your account. Feedback and ideas are appreciated. Contact me at Discord `firedigger`  
The script can be added to [Tampermonkey](https://www.tampermonkey.net) extension for auto-loading, but you can try the script manually without installing anything just by going to the polymarket website and pasting the desired JS file contents into the browser console.  
After installing click "Create new script", paste the JS file content into the window and save. The script will activate on the corresponding pages immediately after a reload and will proceed to be applied automatically until toggled off.  
Keep in mind that each script from the list below is operated via a separate file. I believe that utilizing the scripts can enchance your polymarket experience, and hopefully these features might even be integrated into the website in the future.

### Security disclaimer
I appreciate and respect your skepticism towards running third-party scripts, especially on websites that involve significant financial assets. While I cannot provide you with a definitive security guarantee without prior trust, and acknowledging the lack of a "safe mode" in Tampermonkey to restrict script capabilities, I want to highlight measures taken to build transparency and trust in this project:
 - The project is open-source
 - The code is not obscure nor long
 - The scripts do not access or rely on session information and function the same on signed-out pages
 - The scripts have no update URL specified in Tampermonkey, ensuring that they will never attempt to auto-update. Additionally, you can configure Tampermonkey to block updates entirely
 - If you're cautious and have development expertise, feel free to extract and adapt only the parts of the code that you find useful. The project is license-free
 - Kindly ask an expert you trust to audit the code. I welcome audits and feedback to further improve trustworthiness

## Daily position price change
Polymarket's deposit page shows the daily development of your portfolio. However, when you have many active bets, it can be difficult to pinpoint which specific bet is responsible for most of the movement in your position value, especially with the volatility of some prices.  
The provided Polymarket userscript makes it easier to track daily price changes, not only for your overall account but also for each individual position. The main benefit is the ability to identify which positions have had the most impact on your daily account standing. The daily change will appear in the "Latest" column on the portfolio page or the "Current" column on the profile page.
![JustKen profile](https://raw.githubusercontent.com/firedigger/polymarket-userscripts/refs/heads/main/screen1.JPG)
![Portfolio](https://raw.githubusercontent.com/firedigger/polymarket-userscripts/refs/heads/main/screen5.JPG)
A change figure is written as long as the API returns a value for it. In most cases the absense of value means no change in price since yesterday. At the moment it won't work on "Load more" positions, only largest 100 positions are processed.
## Market annualized return rate
You’ve likely come across markets with a highly expected outcome, where one side trades at 90+. These may seem like "free money" opportunities. However, apart from price, another key aspect of a market is the deadline, as the price will naturally converge toward 100 as the deadline approaches. The ARR (Annualized Return on Investment) figure helps you compare multiple "safe-bet" markets by calculating the annualized return assuming the likely (>50) outcome prevails.  
You can then compare this number to benchmarks like 5% (regarded as risk-free for bank deposits or bonds) or up to 30% (an example return for a lower-risk stock market index S&P 500 in some recent years). Thus betting on a market with an ARR below 30% might not be the best investment, considering there's a risk of losing your entire deposit (while even in a major US market crash, the S&P 500 will only lose a part of its value). By focusing on lower-risk bets with a reasonable ARR, you can aim for consistent yields. But, of course, be mindful that statistically unlikely events do happen.  
The script conveniently displays the ARR next to the market's deadline. On the multiple outcome options markets it will show ARR per option row.
![Crimean bridge hit before November market](https://raw.githubusercontent.com/firedigger/polymarket-userscripts/refs/heads/main/screen2.JPG)
![Fed Interest Rates: December 2024 market](https://raw.githubusercontent.com/firedigger/polymarket-userscripts/refs/heads/main/screen4.JPG)
## Unrealized profit and maximum likelihood portfolio value
Transparency is a strong feature of the Polymarket platform. All bettors' profiles are public, including their positions, history, and profits. This openness allows you to check if an outspoken user in the comment section has results that match their claims. However, the profit figure displayed on profiles is a combination of past bets and current position gains, which can blur the line between historical success and current sentiment.  
To address this, the script extracts the unrealized profit from current positions, making it easier to distinguish between past and present performance. The unrealized profit will be displayed on the profile, allowing you to subtract it from the total to calculate past profits.  
In the portfolio, each position shows a "To Win" value—what you would earn if your prediction is correct. However, this value isn't accumulated for all bets, and it's unrealistic to expect every bet to win. The portfolio value represents the Estimated Value (EV) of active bets, calculated based on market probabilities.  
The script also provides an easy way to estimate the potential monetary outcome of your positions by assuming bets with over 50% probability will win and those with less than 50% will lose. It accumulates these values to provide what is known as the Maximum Likelihood Estimate (MLE). While the actual outcome might differ, statistically, this represents the most probable result once all bets are settled. This MLE figure will be displayed below the portfolio value on the profile page and can be especially useful when balancing a mix of high- and low-chance bets.
![PrincessCaro profile](https://raw.githubusercontent.com/firedigger/polymarket-userscripts/refs/heads/main/screen3.JPG)
The value under volume shows the initial investment total on the active positions. In general Polymarket's volume value has a formula aimed at exaggerating numbers and probably doesn't show what you would expect.  
The value under markets shows the number of active positions, which is also arguably more practical than the number of markets traded within the profile's lifetime.
## Following bettors' positions on the market page
From Polymarket API it is possible to query any user's position on any market. This way, when assessing whether you have a good bet guess for a given market, you could check if your following bettors have made their choice, giving your relevant insight. Normally you can see top holders of each side on the market page with some familiar names, but the script provider a faster view onto selected individuals, especially on multi-option markets and in the future when there will be more unfamiliar players. The script links via ids so is resistant to profile renames.
![Israel strike on Iranian nuclear facility in 2024 market](https://raw.githubusercontent.com/firedigger/polymarket-userscripts/refs/heads/main/screen6.JPG)

[ko-fi](https://ko-fi.com/firedigger)