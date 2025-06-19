# QAOA-Based Portfolio Optimization - Fixed Version
# Extracting Real-Time data from yfinance

# Optimization modeling
from qiskit_optimization import QuadraticProgram
from qiskit_optimization.algorithms import MinimumEigenOptimizer

# QAOA & optimizer
from qiskit_algorithms import QAOA
from qiskit_algorithms.optimizers import COBYLA

# Aer Sampler primitive for QAOA
from qiskit_aer.primitives import Sampler

# Numerical & stock data libraries
import numpy as np
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
import warnings

# Suppress specific deprecation warnings
warnings.filterwarnings("ignore", category=DeprecationWarning, module="qiskit_aer")

class Magnificent_7:
    def __init__(self, B, days, interval, start):
        # Tickers of Magnificent 7 stocks
        self.tickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META']
        self.n = len(self.tickers)
        
        # Ensure Budget is within range
        if not (1 <= B <= self.n):
            raise ValueError(f"Budget must be between 1 and {self.n}")
        
        self.B = B
        
        # Download Data from Yahoo Finance
        self.data = self._download_data(days, interval, start)

        # Expected Returns and Covariance Matrix
        self.mu = np.empty((self.n, 1))
        self.sigma = np.empty((self.n, self.n))

        # Parameters for QUBO formulation
        self.risk_aversion = 1.0  # Risk aversion parameter
        self.penalty_strength = 10.0  # Penalty for constraint violation

        # QUBO Matrix for QAOA Optimization
        self.qubo_matrix = np.empty((self.n, self.n))

    def _download_data(self, days, interval, start):
        """Download data with proper error handling and automatic end date calculation"""
    
        # Convert start date string to datetime object
        start_date = datetime.strptime(start, '%Y-%m-%d')
        
        # Calculate end date by adding the specified number of days
        # We add extra days to account for weekends and holidays
        # Typically need about 1.4x calendar days to get the desired trading days
        calendar_days_needed = int(days * 1.4) + 7  # Add buffer for weekends/holidays
        end_date = start_date + timedelta(days=calendar_days_needed)
        end_date_str = end_date.strftime('%Y-%m-%d')
        
        print(f"Downloading data from {start} to {end_date_str} (to get ~{days} trading days)")
        
        data = yf.download(
            tickers=self.tickers, 
            start=start,
            end=end_date_str, 
            interval=interval,
            auto_adjust=True,
            rounding=True,
            progress=False
        )['Close']
        
        # Handle single ticker case
        if len(self.tickers) == 1:
            data = pd.DataFrame(data, columns=self.tickers)
        
        # Limit to the requested number of days
        if len(data) > days:
            data = data.tail(days)  # Take the most recent 'days' trading days
        
        # Check for missing data
        if data.isnull().any().any():
            print("Warning: Some data is missing. Forward filling...")
            data = data.fillna(method='ffill').dropna()
        
        if data.empty:
            raise ValueError("No data available for the specified period")
        
        actual_days = len(data)
        print(f"Successfully downloaded {actual_days} trading days of data")
        
        if actual_days < days:
            print(f"Warning: Only {actual_days} trading days available (requested {days})")
            
        return data
            
    def compute_returns(self):
        """Compute daily returns matrix"""
        returns_df = self.data.pct_change().dropna()
        
        if returns_df.empty:
            raise ValueError("Insufficient data to compute returns")
            
        returns_matrix = returns_df.to_numpy()
        return returns_matrix
    
    def compute_mu(self, returns_matrix):
        """Compute expected returns (mean of historical returns)"""
        self.mu = np.mean(returns_matrix, axis=0).reshape(-1, 1)
        return self.mu

    def covariance_matrix(self, returns_matrix):
        """Compute covariance matrix of returns"""
        self.sigma = np.cov(returns_matrix.T)
        return self.sigma

    def build_qubo_matrix(self, mu, sigma, risk_aversion, penalty_strength, B):
        """
        Build QUBO matrix for portfolio optimization
        Objective: Minimize risk - expected_return + penalty for constraint violation
        
        The QUBO formulation for selecting exactly B assets:
        Q_ii = risk_aversion * sigma_ii - mu_i + penalty * (1 - 2*B)
        Q_ij = risk_aversion * sigma_ij + 2 * penalty (for i != j)
        """
        
        # Initialize QUBO matrix
        self.qubo_matrix = np.zeros((self.n, self.n))
        
        # Diagonal terms: individual asset risk and return, plus penalty
        for i in range(self.n):
            self.qubo_matrix[i, i] = (
                risk_aversion * sigma[i, i] - mu[i, 0] + penalty_strength * (1 - 2 * B)
            )
        
        # Off-diagonal terms: covariance and penalty
        for i in range(self.n):
            for j in range(i + 1, self.n):
                covariance_term = risk_aversion * sigma[i, j]
                penalty_term = 2 * penalty_strength
                
                self.qubo_matrix[i, j] = covariance_term + penalty_term
                self.qubo_matrix[j, i] = covariance_term + penalty_term
        
        return self.qubo_matrix

    def build_quadratic_program(self, qubo):
        """Build quadratic program for Qiskit optimization"""
        program = QuadraticProgram()

        # Add binary variables for each asset
        for i in range(self.n):
            program.binary_var(name=f"x{i}")

        # Build objective function from QUBO matrix
        linear = {}
        quadratic = {}

        # Linear terms (diagonal of QUBO)
        for i in range(self.n):
            linear[i] = qubo[i, i]

        # Quadratic terms (off-diagonal of QUBO)
        for i in range(self.n):
            for j in range(i + 1, self.n):
                if qubo[i, j] != 0:
                    quadratic[(i, j)] = qubo[i, j]

        program.minimize(linear=linear, quadratic=quadratic)
        
        # Add constraint: select exactly B assets
        program.linear_constraint(
            linear={i: 1 for i in range(self.n)},
            sense="==",
            rhs=self.B,
            name="asset_selection"
        )

        return program

    def quantum_optimizer(self, program, max_iterations=200):
        """Run QAOA optimization"""
        try:    
            # Set up QAOA with more iterations using SamplerV2
            sampler = Sampler()
            optimizer = COBYLA(maxiter=max_iterations)
            qaoa = QAOA(sampler=sampler, optimizer=optimizer, reps=2)  # 2 QAOA layers

            solver = MinimumEigenOptimizer(qaoa)
            result = solver.solve(program)
        
            return result
        except Exception as e:
            raise Exception(f"Optimization failed: {str(e)}")

    def analyze_solution(self, result):
        """Analyze and display the optimization results"""
        if result.x is None:
            print("No solution found!")
            return None, None, None
        
        x_opt = result.x
        fval = result.fval
        
        # Get selected assets
        selected_assets = [self.tickers[i] for i in range(self.n) if x_opt[i] == 1]
        
        # Calculate portfolio metrics
        selected_indices = [i for i in range(self.n) if x_opt[i] == 1]
        
        if len(selected_indices) > 0:
            portfolio_return = np.sum([self.mu[i, 0] for i in selected_indices])
            
            # Portfolio risk (variance)
            portfolio_variance = 0
            for i in selected_indices:
                for j in selected_indices:
                    portfolio_variance += self.sigma[i, j]
            
            portfolio_risk = np.sqrt(portfolio_variance)
        else:
            portfolio_return = 0
            portfolio_risk = 0
        
        return selected_assets, portfolio_return, portfolio_risk, fval

    def run_optimization(self):
        """Run the complete optimization process"""
        print("Computing returns and statistics...")
        
        # Compute returns and statistics
        returns_matrix = self.compute_returns()
        mu = self.compute_mu(returns_matrix)
        sigma = self.covariance_matrix(returns_matrix)
        
        print(f"Expected returns: {mu.flatten()}")
        print(f"Risk (std dev): {np.sqrt(np.diag(sigma))}")
        
        # Build QUBO matrix
        qubo_matrix = self.build_qubo_matrix(
            mu, sigma, self.risk_aversion, self.penalty_strength, self.B
        )
        
        # Create optimization program
        program = self.build_quadratic_program(qubo_matrix)
        
        print("Running QAOA optimization...")
        
        # Run optimization
        result = self.quantum_optimizer(program)
        
        # Analyze results
        selected_assets, portfolio_return, portfolio_risk, objective_value = self.analyze_solution(result)
        
        return {
            'selected_assets': selected_assets,
            'portfolio_return': portfolio_return,
            'portfolio_risk': portfolio_risk,
            'objective_value': objective_value,
            'mu': mu,
            'sigma': sigma
        }


def validate_date(date_string):
    """Validate date format"""
    try:
        datetime.strptime(date_string, '%Y-%m-%d')
        return True
    except ValueError:
        return False


def get_user_inputs():
    """Get and validate user inputs"""
    print("=== QAOA Portfolio Optimization for Magnificent 7 ===")
    print("Available stocks: AAPL, MSFT, GOOGL, AMZN, NVDA, TSLA, META")
    print()
    
    # Get budget
    while True:
        try:
            budget = int(input("How many stocks do you want to select (1-7): "))
            if 1 <= budget <= 7:
                break
            else:
                print("Please enter a number between 1 and 7")
        except ValueError:
            print("Please enter a valid integer")
    
    # Get number of days
    while True:
        try:
            days = int(input("How many trading days of historical data (e.g., 30): "))
            if days > 0:
                break
            else:
                print("Please enter a positive number")
        except ValueError:
            print("Please enter a valid integer")
    
    # Get interval
    interval = "1d"  # Default to daily
    
    # Get start date
    while True:
        start = input("Start date (YYYY-MM-DD): ")
        if validate_date(start):
            break
        else:
            print("Please enter date in YYYY-MM-DD format")
    
    print(f"\nNote: End date will be automatically calculated to get approximately {days} trading days from {start}")
    
    return budget, days, interval, start


if __name__ == "__main__":
    try:
        # Get user inputs
        budget, days, interval, start = get_user_inputs()
        
        # Create optimizer instance
        optimizer = Magnificent_7(B=budget, days=days, interval=interval, start=start)
        
        # Run optimization
        results = optimizer.run_optimization()
        
        # Display results
        print("\n" + "="*50)
        print("OPTIMIZATION RESULTS")
        print("="*50)
        print(f"Selected Assets: {results['selected_assets']}")
        print(f"Portfolio Expected Return: {results['portfolio_return']:.4f}")
        print(f"Portfolio Risk (Std Dev): {results['portfolio_risk']:.4f}")
        print(f"Objective Value: {results['objective_value']:.4f}")
        
        if results['portfolio_risk'] > 0:
            sharpe_ratio = results['portfolio_return'] / results['portfolio_risk']
            print(f"Risk-Return Ratio: {sharpe_ratio:.4f}")
        
    except Exception as e:
        print(f"Error: {str(e)}")
        print("Please check your inputs and try again.")