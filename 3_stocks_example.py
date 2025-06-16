# QAOA-Based Portfolio Optimization for 3 stocks


# Optimization modeling
from qiskit_optimization import QuadraticProgram
from qiskit_optimization.algorithms import MinimumEigenOptimizer

# QAOA & optimizer
from qiskit_algorithms import QAOA
from qiskit_algorithms.optimizers import COBYLA

# Aer Sampler primitive for QAOA
from qiskit_aer.primitives import Sampler as AerSampler

# Numerical & stock data libraries
import numpy as np

# Returns for AAPL, MSFT and GOOG hard-coded
returns = np.array([
  [0.012, 0.008, 0.010],
  [0.010, 0.005, 0.009],
  [-0.005, -0.002, -0.003],
  [0.006, 0.003, 0.005],
  [0.011, 0.007, 0.010]
])

# Stocks chosen for optimization
stock_names = ["GOOG", "MSFT", "AAPL"]

# Step 1: Compute mean return vector μ
mu = np.empty((3, 1))

def compute_mean():
    for i in range(3):
        mu[i] = np.mean(returns[:, i])
    return mu

mu = compute_mean()

# Step 2: Compute covariance matrix

def covariance_matrix():
    return np.cov(returns.T)  # Transpose so each column is a stock

sigma = covariance_matrix()

# Step 3: Construct QUBO matrix

q = 1.0      # Risk factor
lam = 0.01   # Penalty strength
B = 2        # Budget: choose 2 out of 3 stocks

def qubo_matrix():
    qubo = np.empty((3, 3))
    for i in range(3):
        for j in range(3):
            if i == j:
                # Diagonal: risk + penalty - reward
                qubo[i][i] = q * sigma[i][i] - mu[i].item() + lam * (1 - 2 * B)
            else:
                # Non-diagonal: cross-covariance + penalty interaction
                qubo[i][j] = q * sigma[i][j] + 2 * lam
    return qubo

qubo = qubo_matrix()

# Step 4: Set up the Quadratic Program

program = QuadraticProgram()

# Add binary variables x0, x1, x2 for the 3 stocks
for i in range(3):
    program.binary_var(name=f"x{i}")

# Build objective from QUBO matrix
linear_coeffs = {}
quadratic_coeffs = {}

for i in range(3):
    linear_coeffs[i] = qubo[i][i]
    for j in range(i + 1, 3):
        quadratic_coeffs[(i, j)] = 2 * qubo[i][j]  # Doubles off-diagonal terms

program.objective.linear = linear_coeffs
program.objective.quadratic = quadratic_coeffs
program.minimize()

# Add budget constraint: select exactly 2 assets
program.linear_constraint(
   linear={0: 1, 1: 1, 2: 1},  # x0 + x1 + x2
   sense='==',
   rhs=B,
   name="budget"
)

# Step 5: Set up and run QAOA

# Use AerSampler as backend
sampler = AerSampler()

# Classical optimizer COBYLA
optimizer = COBYLA(maxiter=30)

# Create QAOA instance with 1 repetition
qaoa = QAOA(sampler=sampler, optimizer=optimizer, reps=1)

# Wrap QAOA in classical optimizer interface
solver = MinimumEigenOptimizer(qaoa)

# Solve the quadratic program
result = solver.solve(program)

# Step 6: Display the result

# Extract selected stocks from bitstring solution
zipped = zip(result.x, stock_names)
selected_stocks = []

for bit, stock in zipped:
    if bit == 1:
        selected_stocks.append(stock)


# Output
print("Optimal Portfolio:", selected_stocks)
print("QUBO Objective Value:", result.fval)