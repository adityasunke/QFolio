# QAOA-Based Portfolio Optimization - Fixed Version
# Extracting Real-Time data from yfinance

# Optimization modeling
from qiskit_optimization import QuadraticProgram
from qiskit_optimization.algorithms import MinimumEigenOptimizer

# QAOA & optimizer
from qiskit_algorithms import QAOA
from qiskit_algorithms.optimizers import COBYLA

# Sampler primitives - V1 removed from IBM Runtime, use compatibility approach
from qiskit_aer.primitives import Sampler as AERSampler
from qiskit_ibm_runtime import QiskitRuntimeService, Session

# IBM Runtime only has V2 samplers now - need compatibility wrapper
from qiskit_ibm_runtime import SamplerV2 as IBMSamplerV2

# Numerical & stock data libraries
import numpy as np
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
import time


class Magnificent_7:
    def __init__(self, B, days, interval, start):
        # Tickers of Magnificent 7 stocks
        self.tickers = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META']
        self.n = len(self.tickers)
        
        # Validate budget
        if not (1 <= B <= self.n):
            raise ValueError(f"Budget must be between 1 and {self.n}")
        
        self.B = B
        
        # Download Data from Yahoo Finance
        self.data = self.download_data(days, interval, start)
        
        # Validate downloaded data
        self.validate_data()

        # Compute statistics FIRST
        returns_matrix = self.compute_returns()
        self.mu = self.compute_mu(returns_matrix)
        self.sigma = self.covariance_matrix(returns_matrix)

        # Parameters for QUBO formulation
        self.risk_aversion = 1.0  # Risk aversion parameter (q)
        self.penalty_strength = 10.0  # Penalty for constraint violation (lambda)

        # Setup for running code on IBM Hardware
        self.service = None
        self.backend = None
        self.setup_ibm_hardware()

        # Build QUBO matrix and program
        self.qubo_matrix = self.build_qubo_matrix(
            self.mu, self.sigma, self.risk_aversion, self.penalty_strength, self.B
        )
        self.program = self.build_quadratic_program(self.qubo_matrix)

    def validate_data(self):
        """Validate downloaded stock data"""
        if self.data.empty:
            raise ValueError("No stock data downloaded")
        
        # Check if all tickers have data
        missing_tickers = []
        for ticker in self.tickers:
            if ticker not in self.data.columns:
                missing_tickers.append(ticker)
        
        if missing_tickers:
            print(f"Warning: Missing data for tickers: {missing_tickers}")
            # Handle missing tickers more explicitly
            available_tickers = [t for t in self.tickers if t in self.data.columns]
            if len(available_tickers) < self.B:
                raise ValueError(f"Not enough stocks available ({len(available_tickers)}) for budget {self.B}")
            print(f"Continuing with {len(available_tickers)} available stocks")
        
        # Check for any columns with all NaN values
        nan_columns = self.data.columns[self.data.isnull().all()].tolist()
        if nan_columns:
            raise ValueError(f"No data available for: {nan_columns}")
        
        print(f"Data validation passed: {len(self.data.columns)} stocks, {len(self.data)} days")

    def setup_ibm_hardware(self):
        """Setup IBM hardware with error handling"""
        try:
            # Use default initialization to avoid deprecation warning
            self.service = QiskitRuntimeService()
            
            # Select backend that can handle our problem size
            suitable_backends = self.service.backends(
                filters=lambda b: (
                    b.num_qubits >= self.n and 
                    b.status().operational and 
                    not b.configuration().simulator
                )
            )
            if suitable_backends:
                self.backend = min(suitable_backends, key=lambda b: b.status().pending_jobs)
                print(f"Selected hardware: {self.backend.name} ({self.backend.num_qubits} qubits)")
                print(f"Current queue: {self.backend.status().pending_jobs} jobs")
            else:
                print("No suitable quantum hardware found. Hardware comparison will be skipped.")
                self.backend = None
                
        except Exception as e:
            print(f"IBM Quantum setup failed: {e}")
            print("Hardware comparison will be skipped.")
            self.service = None
            self.backend = None
    
    def download_data(self, days, interval, start):
        # Convert start date string to datetime object
        start_date = datetime.strptime(start, '%Y-%m-%d')
        
        # Calculate end date by adding the specified number of days
        # Add extra days to account for weekends and holidays
        # Typically need about 1.4x calendar days to get the desired trading days
        calendar_days_needed = int(days * 1.4) + 7  # Add buffer for weekends/holidays
        end_date = start_date + timedelta(days=calendar_days_needed)
        end_date_str = end_date.strftime('%Y-%m-%d')
        
        print(f"Downloading data from {start} to {end_date_str} (to get ~{days} trading days)")
        
        try:
            data = yf.download(
                tickers=self.tickers, 
                start=start,
                end=end_date_str, 
                interval=interval,
                auto_adjust=True, 
                rounding=True,
                progress=False  # Suppress progress bar
            )['Close']
        except Exception as e:
            raise ValueError(f"Failed to download data: {e}")
                
        # Limit to the requested number of days
        if len(data) > days:
            data = data.tail(days)  # Take the most recent 'days' trading days
        
        if data.empty:
            raise ValueError("No data available for the specified period")
        
        actual_days = len(data)
        print(f"Successfully downloaded {actual_days} trading days of data")
        
        return data
            
    def compute_returns(self):
        """Compute daily returns matrix"""
        returns_df = self.data.pct_change().dropna()
        
        # Check if we have enough data after dropping NaN
        if len(returns_df) < 2:
            raise ValueError("Insufficient data for return calculation")
            
        returns_matrix = returns_df.to_numpy()
        return returns_matrix
    
    def compute_mu(self, returns_matrix):
        """Compute expected returns (mean of historical returns)"""
        mu = np.mean(returns_matrix, axis=0).reshape(-1, 1)
        
        # Check for any NaN values in expected returns
        if np.any(np.isnan(mu)):
            raise ValueError("NaN values found in expected returns")
            
        return mu

    def covariance_matrix(self, returns_matrix):
        """Compute covariance matrix of returns"""
        sigma = np.cov(returns_matrix.T)
        
        # Check for any NaN values in covariance matrix
        if np.any(np.isnan(sigma)):
            raise ValueError("NaN values found in covariance matrix")
            
        return sigma

    def build_qubo_matrix(self, mu, sigma, risk_aversion, penalty_strength, B):
        """
        Build QUBO matrix for portfolio optimization
        Objective: Minimize risk - expected_return + penalty for constraint violation
        
        The QUBO formulation for selecting exactly B assets:
        Q_ii = risk_aversion * sigma_ii - mu_i + penalty * (1 - 2*B) [Diagonal Entries]
        Q_ij = risk_aversion * sigma_ij + 2 * penalty  [Off Diagonal Entries]
        """
        
        # Initialize QUBO matrix
        qubo_matrix = np.zeros((self.n, self.n))
        
        # Diagonal terms: individual asset risk and return, plus penalty
        for i in range(self.n):
            qubo_matrix[i, i] = (risk_aversion * sigma[i, i] - mu[i, 0] 
                               + penalty_strength * (1 - 2 * B))
        
        # Off-diagonal terms: covariance and penalty
        for i in range(self.n):
            for j in range(i + 1, self.n):
                covariance_term = risk_aversion * sigma[i, j]
                penalty_term = 2 * penalty_strength
                
                qubo_matrix[i, j] = covariance_term + penalty_term
                qubo_matrix[j, i] = covariance_term + penalty_term  # Symmetric
        
        return qubo_matrix

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
            name="asset_selection_constraint"
        )

        return program

    def simulator_optimization(self, max_iterations=10, reps=2):
        """Run QAOA optimization on simulator with V1 API"""
        print("\nRunning QAOA on Aer Simulator...")
        print(f"Parameters: {max_iterations} iterations, {reps} QAOA layers")
        start_time = time.time()

        try:
            # Use V1 Sampler for QAOA compatibility
            sampler = AERSampler()
            optimizer = COBYLA(maxiter=max_iterations)
            qaoa = QAOA(sampler=sampler, optimizer=optimizer, reps=reps)

            solver = MinimumEigenOptimizer(qaoa)
            result = solver.solve(self.program)

            execution_time = time.time() - start_time
            return result, execution_time
            
        except Exception as e:
            print(f"Simulator optimization failed: {e}")
            print(f"Error details: {type(e).__name__}: {str(e)}")
            return None, 0
    
    def hardware_optimization(self, max_iterations=10, reps=1):
        """Run QAOA optimization on IBM hardware using modern V2 primitives approach"""
        if not self.backend:
            print("\nNo Hardware Available")
            return None, 0
        
        print(f"\nRunning QAOA on {self.backend.name}")
        print(f"Parameters: {max_iterations} iterations, {reps} QAOA layers")
        print("Using modern Qiskit Runtime V2 primitives...")
        print("This may take several minutes due to queue times...")

        start_time = time.time()

        try:
            # Modern approach: Build QAOA manually with V2 primitives
            print("Building QAOA circuit manually with V2 primitives...")
            
            # Import modern primitives and circuit libraries
            from qiskit.circuit.library import QAOAAnsatz
            from qiskit.quantum_info import SparsePauliOp
            from qiskit_ibm_runtime import Session, EstimatorV2 as Estimator
            from qiskit.transpiler.preset_passmanagers import generate_preset_pass_manager
            from scipy.optimize import minimize
            import numpy as np
            
            # Step 1: Convert QUBO matrix to Pauli operator (Hamiltonian)
            hamiltonian = self._qubo_to_pauli_operator(self.qubo_matrix)
            print(f"Created Hamiltonian with {len(hamiltonian)} terms")
            
            # Step 2: Create QAOA ansatz
            qaoa_circuit = QAOAAnsatz(hamiltonian, reps=reps)
            print(f"Created QAOA circuit with {qaoa_circuit.num_qubits} qubits and {reps} layers")
            
            # Step 3: Transpile for hardware
            pm = generate_preset_pass_manager(backend=self.backend, optimization_level=1)
            isa_circuit = pm.run(qaoa_circuit)
            print(f"Transpiled circuit: {isa_circuit.depth()} depth, {isa_circuit.count_ops()} gates")
            
            # CRITICAL FIX: Expand Hamiltonian to match transpiled circuit qubits
            expanded_hamiltonian = self._expand_hamiltonian_to_backend(hamiltonian, isa_circuit.num_qubits)
            print(f"Expanded Hamiltonian to {isa_circuit.num_qubits} qubits")
            
            # Step 4: Run optimization with Session
            with Session(backend=self.backend) as session:
                estimator = Estimator(mode=session)
                estimator.options.default_shots = 1024
                
                # Cost function for optimization
                def cost_function(params):
                    # Update circuit parameters
                    job = estimator.run([(isa_circuit, expanded_hamiltonian, params)])
                    result = job.result()
                    return result[0].data.evs
                
                # Initial parameters
                initial_params = np.random.uniform(0, 2*np.pi, qaoa_circuit.num_parameters)
                print(f"Starting optimization with {len(initial_params)} parameters...")
                
                # Classical optimization
                result = minimize(
                    cost_function,
                    initial_params,
                    method='COBYLA',
                    options={'maxiter': max_iterations}
                )
                
                print(f"Optimization completed: {result.success}")
                print(f"Final cost: {result.fun}")
                
                # Get final solution by sampling
                optimal_params = result.x
                final_circuit = isa_circuit.assign_parameters(optimal_params)
                
                # Use SamplerV2 to get final bitstrings
                from qiskit_ibm_runtime import SamplerV2 as Sampler
                sampler = Sampler(mode=session)
                sampler.options.default_shots = 1024
                
                # Add measurements to circuit
                final_circuit.measure_all()
                
                job = sampler.run([final_circuit])
                counts_result = job.result()
                counts = counts_result[0].data.meas.get_counts()
                
                # Convert to optimization result format
                optimization_result = self._process_qaoa_counts(counts, result.fun, isa_circuit)
                
            execution_time = time.time() - start_time
            print("Modern QAOA with V2 primitives succeeded!")
            return optimization_result, execution_time
            
        except Exception as e:
            print(f"Modern QAOA failed: {e}")
            print(f"Error details: {type(e).__name__}: {str(e)}")
            import traceback
            traceback.print_exc()
            execution_time = time.time() - start_time
            return None, execution_time

    def _expand_hamiltonian_to_backend(self, hamiltonian, target_num_qubits):
        """Expand Hamiltonian to match the number of qubits in the transpiled circuit"""
        from qiskit.quantum_info import SparsePauliOp
        
        original_num_qubits = hamiltonian.num_qubits
        if target_num_qubits == original_num_qubits:
            return hamiltonian
        
        # Create new Pauli strings with additional identity operators
        expanded_pauli_list = []
        
        for pauli_str, coeff in zip(hamiltonian.paulis, hamiltonian.coeffs):
            # Convert to string representation
            pauli_string = str(pauli_str)
            
            # Pad with identity operators to reach target size
            padding_needed = target_num_qubits - original_num_qubits
            expanded_pauli_string = pauli_string + 'I' * padding_needed
            
            expanded_pauli_list.append((expanded_pauli_string, coeff))
        
        return SparsePauliOp.from_list(expanded_pauli_list)

    def _process_qaoa_counts(self, counts, objective_value, circuit):
        """Process QAOA sampling results to extract solution"""
        # Find the most probable bitstring
        max_count = 0
        best_bitstring = None
        
        for bitstring, count in counts.items():
            if count > max_count:
                max_count = count
                best_bitstring = bitstring
        
        # Convert bitstring to solution vector
        if best_bitstring:
            # Get the mapping of logical to physical qubits
            # We need to extract the original 7 qubits from the 127-qubit result
            
            # Find which physical qubits correspond to our logical qubits
            x_opt = [0] * self.n
            
            try:
                if hasattr(circuit, 'layout') and circuit.layout is not None:
                    # Handle different layout types
                    if hasattr(circuit.layout, 'get_virtual_bits'):
                        # Old style layout
                        physical_to_logical = {}
                        for logical, physical in circuit.layout.get_virtual_bits().items():
                            if logical.index < self.n:  # Only care about our problem qubits
                                physical_to_logical[physical] = logical.index
                        
                        # Extract relevant bits
                        for physical_idx, bit_value in enumerate(reversed(best_bitstring)):
                            if physical_idx in physical_to_logical:
                                logical_idx = physical_to_logical[physical_idx]
                                x_opt[logical_idx] = int(bit_value)
                    
                    elif hasattr(circuit.layout, 'initial_layout'):
                        # New style TranspileLayout
                        initial_layout = circuit.layout.initial_layout
                        if initial_layout is not None:
                            # Map physical qubits back to logical qubits
                            physical_to_logical = {}
                            for logical_qubit, physical_qubit in initial_layout.items():
                                if logical_qubit.index < self.n:
                                    physical_to_logical[physical_qubit] = logical_qubit.index
                            
                            # Extract relevant bits
                            for physical_idx, bit_value in enumerate(reversed(best_bitstring)):
                                if physical_idx in physical_to_logical:
                                    logical_idx = physical_to_logical[physical_idx]
                                    x_opt[logical_idx] = int(bit_value)
                        else:
                            # Fallback: assume first n qubits are our problem qubits
                            x_opt = [int(bit) for bit in best_bitstring[::-1][:self.n]]
                    else:
                        # Fallback: assume first n qubits are our problem qubits
                        x_opt = [int(bit) for bit in best_bitstring[::-1][:self.n]]
                else:
                    # No layout info, use fallback
                    x_opt = [int(bit) for bit in best_bitstring[::-1][:self.n]]
                    
            except Exception as layout_error:
                print(f"Layout processing failed: {layout_error}")
                print("Using fallback approach...")
                # Fallback: assume first n qubits are our problem qubits
                x_opt = [int(bit) for bit in best_bitstring[::-1][:self.n]]
            
            print(f"Extracted solution: {x_opt}")
            print(f"Selected {sum(x_opt)} assets (expected {self.B})")
            
            # Create a mock result object similar to MinimumEigenOptimizer
            class QAOAResult:
                def __init__(self, x, fval):
                    self.x = x
                    self.fval = fval
            
            return QAOAResult(x_opt, objective_value)
        
        return None

    def _qubo_to_pauli_operator(self, qubo_matrix):
        """Convert QUBO matrix to SparsePauliOp for use with EstimatorV2"""
        from qiskit.quantum_info import SparsePauliOp
        
        pauli_list = []
        
        # Linear terms (diagonal)
        for i in range(self.n):
            if qubo_matrix[i, i] != 0:
                pauli_str = 'I' * i + 'Z' + 'I' * (self.n - i - 1)
                pauli_list.append((pauli_str, -0.5 * qubo_matrix[i, i]))
                
        # Quadratic terms (off-diagonal)
        for i in range(self.n):
            for j in range(i + 1, self.n):
                if qubo_matrix[i, j] != 0:
                    pauli_str = ['I'] * self.n
                    pauli_str[i] = 'Z'
                    pauli_str[j] = 'Z'
                    pauli_str = ''.join(pauli_str)
                    pauli_list.append((pauli_str, 0.25 * qubo_matrix[i, j]))
        
        # Constant term
        constant = np.sum(np.diag(qubo_matrix)) * 0.5
        pauli_list.append(('I' * self.n, constant))
        
        return SparsePauliOp.from_list(pauli_list)

    def _process_qaoa_counts(self, counts, objective_value, circuit):
        """Process QAOA sampling results to extract solution"""
        # Find the most probable bitstring
        max_count = 0
        best_bitstring = None
        
        for bitstring, count in counts.items():
            if count > max_count:
                max_count = count
                best_bitstring = bitstring
        
        # Convert bitstring to solution vector
        if best_bitstring:
            # Get the mapping of logical to physical qubits
            # We need to extract the original 7 qubits from the 127-qubit result
            
            # Find which physical qubits correspond to our logical qubits
            if hasattr(circuit, 'layout') and circuit.layout is not None:
                # Use the layout to map back to logical qubits
                physical_to_logical = {}
                for logical, physical in circuit.layout.get_virtual_bits().items():
                    if logical.index < self.n:  # Only care about our problem qubits
                        physical_to_logical[physical] = logical.index
                
                # Extract relevant bits
                x_opt = [0] * self.n
                for physical_idx, bit_value in enumerate(reversed(best_bitstring)):
                    if physical_idx in physical_to_logical:
                        logical_idx = physical_to_logical[physical_idx]
                        x_opt[logical_idx] = int(bit_value)
            else:
                # Fallback: assume first n qubits are our problem qubits
                x_opt = [int(bit) for bit in best_bitstring[::-1][:self.n]]
            
            # Create a mock result object similar to MinimumEigenOptimizer
            class QAOAResult:
                def __init__(self, x, fval):
                    self.x = x
                    self.fval = fval
            
            return QAOAResult(x_opt, objective_value)
        
        return None

    def analyze_solution(self, result):
        """Analyze and display the optimization results"""
        if result is None:
            return None, None, None, None
        
        try:
            x_opt = result.x # Binary decision vector
            fval = result.fval # Minimized objective function
            
            # Validate solution
            if len(x_opt) != self.n:
                print(f"Warning: Solution length {len(x_opt)} doesn't match problem size {self.n}")
                return None, None, None, None
            
            # Get selected assets
            selected_assets = [self.tickers[i] for i in range(self.n) if x_opt[i] == 1]
            
            # Validate constraint satisfaction
            if len(selected_assets) != self.B:
                print(f"Warning: Selected {len(selected_assets)} assets, expected {self.B}")
            
            # Calculate portfolio metrics
            selected_indices = [i for i in range(self.n) if x_opt[i] == 1]
            
            if not selected_indices:  # No assets selected
                return [], 0.0, 0.0, fval
            
            portfolio_return = np.sum([self.mu[i, 0] for i in selected_indices])
            
            # Portfolio risk (variance)
            portfolio_variance = 0
            for i in selected_indices:
                for j in selected_indices:
                    portfolio_variance += self.sigma[i, j]
            
            portfolio_risk = np.sqrt(max(0, portfolio_variance))  # Ensure non-negative
        
            return selected_assets, portfolio_return, portfolio_risk, fval
            
        except Exception as e:
            print(f"Error analyzing solution: {e}")
            return None, None, None, None

    def compare_optimizations(self):
        """Run both optimizations and compare results"""
        
        print("="*60)
        print("QAOA PORTFOLIO OPTIMIZATION COMPARISON")
        print("="*60)
        print(f"Problem: Select {self.B} assets from {self.n} stocks")
        print(f"Expected returns: {self.mu.flatten()}")
        print(f"Risk (standard deviation): {np.sqrt(np.diag(self.sigma))}")
        
        results = {}
        
        # Run simulator optimization
        sim_result, sim_time = self.simulator_optimization()
        sim_assets, sim_return, sim_risk, sim_objective = self.analyze_solution(sim_result)
        
        results['simulator'] = {
            'selected_assets': sim_assets,
            'portfolio_return': sim_return,
            'portfolio_risk': sim_risk,
            'objective_value': sim_objective,
            'execution_time': sim_time,
            'success': sim_result is not None and sim_assets is not None
        }
        
        # Run hardware optimization
        hw_result, hw_time = self.hardware_optimization()
        hw_assets, hw_return, hw_risk, hw_objective = self.analyze_solution(hw_result)
        
        results['hardware'] = {
            'selected_assets': hw_assets,
            'portfolio_return': hw_return,
            'portfolio_risk': hw_risk,
            'objective_value': hw_objective,
            'execution_time': hw_time,
            'success': hw_result is not None and hw_assets is not None
        }
        
        return results

    def display_comparison(self, results):
        """Display comparison results"""
        
        print("\n" + "="*60)
        print("COMPARISON RESULTS")
        print("="*60)
        
        # Simulator Results
        print("\nSIMULATOR RESULTS:")
        sim = results['simulator']
        if sim['success']:
            print(f"   Selected Assets: {sim['selected_assets']}")
            print(f"   Portfolio Return: {sim['portfolio_return']:.4f}")
            print(f"   Portfolio Risk: {sim['portfolio_risk']:.4f}")
            print(f"   Objective Value: {sim['objective_value']:.4f}")
            if sim['portfolio_risk'] > 0:
                sim_sharpe = sim['portfolio_return'] / sim['portfolio_risk']
                print(f"   Risk-Return Ratio: {sim_sharpe:.4f}")
            print(f"   Execution Time: {sim['execution_time']:.2f} seconds")
        else:
            print("   Simulator optimization failed")
        
        # Hardware Results
        print("\nHARDWARE RESULTS:")
        hw = results['hardware']
        if hw['success']:
            print(f"   Selected Assets: {hw['selected_assets']}")
            print(f"   Portfolio Return: {hw['portfolio_return']:.4f}")
            print(f"   Portfolio Risk: {hw['portfolio_risk']:.4f}")
            print(f"   Objective Value: {hw['objective_value']:.4f}")
            if hw['portfolio_risk'] > 0:
                hw_sharpe = hw['portfolio_return'] / hw['portfolio_risk']
                print(f"   Risk-Return Ratio: {hw_sharpe:.4f}")
            print(f"   Execution Time: {hw['execution_time']:.2f} seconds")
        else:
            print("   Hardware optimization not available or failed")
        
        # Comparison
        if sim['success'] and hw['success']:
            print("\nCOMPARISON ANALYSIS:")
            print(f"   Asset Selection Match: {sim['selected_assets'] == hw['selected_assets']}")
            print(f"   Return Difference: {abs(sim['portfolio_return'] - hw['portfolio_return']):.4f}")
            print(f"   Risk Difference: {abs(sim['portfolio_risk'] - hw['portfolio_risk']):.4f}")
            print(f"   Objective Difference: {abs(sim['objective_value'] - hw['objective_value']):.4f}")
            if sim['execution_time'] > 0:
                speed_ratio = hw['execution_time'] / sim['execution_time']
                print(f"   Speed Ratio: {speed_ratio:.1f}x slower (hardware)")
            else:
                print("   Speed Ratio: Unable to calculate (simulator time ~0)")


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
        
    return budget, days, interval, start


if __name__ == "__main__":
    try:
        # Get user inputs
        budget, days, interval, start = get_user_inputs()

        # Create optimizer instance
        optimizer = Magnificent_7(B=budget, days=days, interval=interval, start=start)

        # Run comparison
        results = optimizer.compare_optimizations()
        
        # Display comparison
        optimizer.display_comparison(results)
        
    except KeyboardInterrupt:
        print("\n\nOptimization interrupted by user")
    except Exception as e:
        print(f"\nError during optimization: {e}")
        import traceback
        traceback.print_exc()