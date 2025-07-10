# QAOA-Based Portfolio Optimization

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
import pandas as pd
import warnings

# Suppress specific deprecation warnings
warnings.filterwarnings("ignore", category=DeprecationWarning, module="qiskit_aer")

class QAOA:
    def __init__(self, B):
        # Tickers of Magnificent 7 stocks
        self.tickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META']
        self.n = len(self.tickers)
        
        # Ensure Budget is within range
        if not (1 <= B <= self.n):
            raise ValueError(f"Budget must be between 1 and {self.n}")
        
        self.B = B
        
        # Expected Returns and Covariance Matrix
        self.mu = np.empty((self.n, 1))
        self.sigma = np.empty((self.n, self.n))

        # Parameters for QUBO formulation
        self.risk_aversion = 1.0  # Risk aversion parameter
        self.penalty_strength = 10.0  # Penalty for constraint violation

        # QUBO Matrix for QAOA Optimization
        self.qubo_matrix = np.empty((self.n, self.n))

        self.data = self.download_data()

        ## Download Data and Compute Returns
    
    def download_data(self):
        data = {}
        for ticker in self.tickers:
            file_path = f"Real Time Implementation/Data/{ticker}_yearly_data_compact.csv"
            df = pd.read_csv(file_path)
            data[ticker] = df
        return data

    def compute_returns(self):
        all_returns = []

        for ticker in self.tickers:
            prices = self.data[ticker]["close"]
            daily_returns = prices.pct_change().iloc[1:].values
            all_returns.append(daily_returns)

        returns_matrix = np.array(all_returns).T
        return returns_matrix

    def compute_mu(self, returns_matrix):
        """Compute expected returns (mean of historical returns)"""
        self.mu = np.mean(returns_matrix, axis=0).reshape(-1, 1)
        return self.mu

    def covariance_matrix(self, returns_matrix):
        """Compute covariance matrix of returns"""
        self.sigma = np.cov(returns_matrix.T)
        return self.sigma

    def build_qubo_matrix(self, mu, sigma):
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
            self.qubo_matrix[i, i] = (self.risk_aversion * sigma[i, i] - mu[i, 0] + self.penalty_strength * (1 - 2 * self.B))
        
        # Off-diagonal terms: covariance and penalty
        for i in range(self.n):
            for j in range(i + 1, self.n):
                covariance_term = self.risk_aversion * sigma[i, j]
                penalty_term = 2 * self.penalty_strength
                
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
            print("No solution found")
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
                    if i == j:
                        portfolio_variance += self.sigma[i, j]
                    else:
                        portfolio_variance += 2 * self.sigma[i, j]
            portfolio_variance *= 0.5
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
        qubo_matrix = self.build_qubo_matrix(mu, sigma)
        
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


if __name__ == "__main__":
    # Create the optimizer object with a budget of 3 assets
    qaoa_optimizer = QAOA(B=3)

    # Run the optimization
    result = qaoa_optimizer.run_optimization()

    # Print results
    print("\n===== QAOA Portfolio Optimization Result =====")
    print(f"Selected assets: {result['selected_assets']}")
    print(f"Expected portfolio return: {result['portfolio_return']:.4f}")
    print(f"Portfolio risk (std dev): {result['portfolio_risk']:.4f}")
    print(f"Objective function value: {result['objective_value']:.4f}")
    print("\nExpected returns (mu):")
    print(result["mu"])
    print("\nCovariance matrix (sigma):")
    print(result["sigma"])