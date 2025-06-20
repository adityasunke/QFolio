"""Extract Data from Alpha Vantage"""

import requests
import time
import pandas as pd
import os
from datetime import datetime
from dotenv import load_dotenv
import warnings

warnings.filterwarnings("ignore", category=FutureWarning)


class Pipeline():
    def __init__(self):
        self.tickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META']
        self.API = os.getenv('API_KEY')
        

    def fetch_data(self):
        for ticker in self.tickers:
            url = (
                "https://www.alphavantage.co/query"
                f"?function=TIME_SERIES_DAILY"
                f"&symbol={ticker}"
                f"&outputsize=full"
                f"&apikey={self.API}"
            )
            response = requests.get(url)
            data = response.json()
            time_series = data.get("Time Series (Daily)")
            if time_series is None:
                print(f"[{ticker}] Error or Rate Limit hit: {data}")
                continue  # Skip this ticker
            df = pd.DataFrame.from_dict(time_series, orient="index")
            df.index = pd.to_datetime(df.index)
            df.columns = ["open", "high", "low", "close", "volume"]
            df = df.sort_index()

            df = df.last("365D")
            df.to_csv(f"{ticker}_yearly_data.csv")


pl = Pipeline()
pl.fetch_data()