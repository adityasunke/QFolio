"""Extract Data from Alpha Vantage"""

import requests
import pandas as pd
import os
from datetime import datetime
from dotenv import load_dotenv
import warnings
import schedule

warnings.filterwarnings("ignore", category=FutureWarning)


class DataExtraction():
    def __init__(self):
        self.tickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META']
        self.API = os.getenv('API_KEY')

    def fetch_data(self):
        for ticker in self.tickers:
            url = (
                "https://www.alphavantage.co/query"
                f"?function=TIME_SERIES_DAILY"
                f"&symbol={ticker}"
                f"&outputsize=compact"
                f"&apikey={self.API}"
            )
            response = requests.get(url)
            data = response.json()
            time_series = data.get("Time Series (Daily)")
            if time_series is None:
                print(f"[{ticker}] Error or Rate Limit hit: {data}")
                continue

            df = pd.DataFrame.from_dict(time_series, orient="index")
            df.index = pd.to_datetime(df.index)
            df.columns = ["open", "high", "low", "close", "volume"]
            df = df.sort_index()

            folder_path = r"Real Time Implementation\Data"
            os.makedirs(folder_path, exist_ok=True)

            file_name = f"{ticker}_yearly_data_compact.csv"
            file_path = os.path.join(folder_path, file_name)

            df.to_csv(file_path, index=True)

    # def refresh(self):
    #     schedule.every().day.at("07:00", "America/New_York").do(self.fetch_data)