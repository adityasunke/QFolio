# QAOA-Based Portfolio Optimization
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

class Magnificent_7:
    def __init__(self, B, period, interval, start, end):
        # Tickers of Magnificent 7 stocks
        self.tickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META']

        self.n = len(self.tickers)

        # Download Data from Yahoo Finance
        self.data = yf.download(
            tickers=self.tickers, 
            period=period, 
            interval=interval, 
            start=start, # Exculsive
            end=end, # Exclusive
            rounding= True
            )[['Close']]

        # Expected Returns and Covariance Matrix
        self.mu = np.empty((self.n, 1))
        self.sigma = np.empty((self.n, self.n))

        # Parameters
        self.B = B
        self.q = 0
        self.lam = 0

        # QUBO Matrix for QAOA Optimization
        self.qubo_matrix = np.empty((self.n, self.n))

        # Minimize Loss Function
        self.Lx = 0
        self.decision_vectors = []

    def compute_returns(self):
        returns_df = self.data.pct_change().dropna()
        returns_matrix = returns_df.to_numpy()
        return returns_matrix
    
    def compute_mu(self, returns_matrix):
        for i in range(self.n):
            self.mu[i] = np.mean(returns_matrix[:, i])
        return self.mu

    def covariance_matrix(self, returns_matrix):
        self.sigma = np.cov(np.transpose(returns_matrix))
        return self.sigma

    def choose_parameters(self, mu, sigma):
        mu_norm = np.linalg.norm(mu)
        sigma_norm = np.linalg.norm(sigma)
        self.q = mu_norm / sigma_norm

        # Norm-based scaling (alpha = 0.5) 
        self.lam = (np.linalg.norm(mu) / np.sqrt(self.n)) * 0.5

        return self.q, self.lam

    def build_qubo_matrix(self, mu, sigma, q, lam, B):
        for i in range(self.n):
            for j in range(self.n):
                if i == j:
                    self.qubo_matrix[i][i] = q * sigma[i][i] - mu[i].item() + lam * (1 - 2 * B)
                else:
                    self.qubo_matrix[i][j] = q * sigma[i][j] + 2 * lam
        return self.qubo_matrix

    def minimize_qubo(self, qubo):
        program = QuadraticProgram()

        for i in range(self.n):
            program.binary_var(name=f"x{i}")

        linear = {}
        quadratic = {}

        for i in range(self.n):
            linear[i] = qubo[i][i]
            for j in range(i + 1, self.n):
                quadratic[(i, j)] = 2 * qubo[i][j]

        program.minimize(linear=linear, quadratic=quadratic)
        
        program.linear_constraint(
            linear={i : 1 for i in range(self.n)},
            sense="==",
            rhs=self.B,
            name="Budget"
        )

        return program

    def quantum_simulator(self, program):
        sampler = Sampler()
        optimizer = COBYLA(maxiter=50)
        qaoa = QAOA(sampler=sampler, optimizer=optimizer)

        solver = MinimumEigenOptimizer(qaoa)
        result = solver.solve(program)

        return result
    


print("Optimize your portfolio for the Magnificent 7 Stocks!")

Budget = int(input("How many stocks do you want to optimize (Choose between 1 and 7): "))
period = input("How many days would you like to optimize (in days): ")
interval = input("What is the time interval between each return (in days): ")
start = input("Which day would you like to start from (Exclusive) (YYYY-MM-DD): ")
end = input("Which day would you like to end on (Exclusive) (YYYY-MM-DD): ")

# Budget = 4
# period = 5
# interval = 1
# start = "2025-06-08"
# end = "2025-06-14"

m7 = Magnificent_7(B=Budget, period=f"{period}d", interval=f"{interval}d", start=start, end=end)

returns_matrix = m7.compute_returns()
mu = m7.compute_mu(returns_matrix=returns_matrix)
sigma = m7.covariance_matrix(returns_matrix=returns_matrix)
q, lam = m7.choose_parameters(mu=mu, sigma=sigma)
qubo_matrix = m7.build_qubo_matrix(mu=mu, sigma=sigma, q=q, lam=lam, B=Budget)
program = m7.minimize_qubo(qubo=qubo_matrix)
result = m7.quantum_simulator(program=program)

x_opt = result.x  # Optimal binary solution
fval = result.fval  # Minimum L(x)

tickers = m7.tickers
chosen = [ticker for bit, ticker in zip(x_opt, tickers) if bit == 1]

print("Optimal Stock Option: ", chosen)
print("Minimized Risk Function: ", fval)
