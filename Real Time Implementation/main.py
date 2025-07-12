from qaoa import QAOA
from data_extraction import DataExtraction


# Extract Data
data = DataExtraction()
data.fetch_data()

# Top 3 stocks from the Magnificent 7 stocks
qaoa = QAOA(B=3)

# Receive the results of the optimization
results = qaoa.run_optimization()

from flask import Flask, render_template_string
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime

# Your QAOA optimizer import here:
# from your_qaoa_script import Magnificent_7

app = Flask(__name__)

# Global storage for the latest result
latest_result = {}

def run_qaoa_job():
    print(f"Running QAOA job at {datetime.now()}")

    # Replace this with your real run
    qaoa = QAOA(B=3)
    result = qaoa.run_optimization()
    
    global latest_result
    latest_result = result

    print("QAOA optimization complete!")

# Schedule it for every day at 09:30
scheduler = BackgroundScheduler()
scheduler.add_job(run_qaoa_job, 'cron', hour=8, minute=0)
scheduler.start()

@app.route("/")
def home():
    global latest_result

    if not latest_result:
        return "<h2>No data yet. Please check back after 9:30am.</h2>"

    html = f"""
    <h2>QAOA Optimization Result</h2>
    <p>Selected assets: {latest_result['selected_assets']}</p>
    <p>Portfolio return: {latest_result['portfolio_return']:.4f}</p>
    <p>Portfolio risk: {latest_result['portfolio_risk']:.4f}</p>
    <p>Objective value: {latest_result['objective_value']:.4f}</p>
    """
    return html
