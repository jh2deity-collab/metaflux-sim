import cobra
import pandas as pd
import numpy as np
import math
import logging
import os
from typing import List, Dict, Optional, Tuple
from byproduct_analyst import ByproductAnalyst


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def sanitize_float(val: float) -> float:
    if val is None:
        return 0.0
    if math.isnan(val) or math.isinf(val):
        return 0.0
    return float(val)

class MetabolicSimulator:
    def __init__(self, model_path: str):
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found: {model_path}")
        if model_path.endswith('.json'):
            self.model = cobra.io.load_json_model(model_path)
        else:
            self.model = cobra.io.read_sbml_model(model_path)
        self.original_model = self.model.copy()
        self.byproduct_analyst = ByproductAnalyst()

    def reset_model(self):
        self.model = self.original_model.copy()

    def apply_environment(self, carbon_source: str, uptake_rate: float, aerobic: bool):
        # Reset to base before applying new constraints
        self.reset_model()
        
        # Configure carbon source
        # Common exchange reactions: EX_glc__D_e, EX_glyc_e, EX_xyl__D_e
        reaction_id = f"EX_{carbon_source}_e"
        if reaction_id in self.model.reactions:
            self.model.reactions.get_by_id(reaction_id).lower_bound = uptake_rate
        
        # Configure oxygen
        if "EX_o2_e" in self.model.reactions:
            o2_reaction = self.model.reactions.get_by_id("EX_o2_e")
            o2_reaction.lower_bound = -20.0 if aerobic else 0.0

    def apply_modifications(self, knockouts: List[str], overexpressions: Dict[str, float]):
        for gene_id in knockouts:
            if gene_id in self.model.genes:
                self.model.genes.get_by_id(gene_id).knock_out()
            elif gene_id in self.model.reactions:
                self.model.reactions.get_by_id(gene_id).knock_out()

        for rxn_id, min_flux in overexpressions.items():
            if rxn_id in self.model.reactions:
                rxn = self.model.reactions.get_by_id(rxn_id)
                rxn.lower_bound = max(rxn.lower_bound, min_flux)

    def simulate(self) -> Dict:
        try:
            solution = self.model.optimize()
            if solution.status != 'optimal':
                return {"success": False, "status": solution.status}

            # Extract fluxes
            fluxes = {k: sanitize_float(v) for k, v in solution.fluxes.items()}
            growth_rate = sanitize_float(solution.objective_value)

            # Extract top 5 byproducts (Excreting exchange reactions)
            ex_fluxes = {r.id: fluxes[r.id] for r in self.model.exchanges if fluxes[r.id] > 1e-6}
            top_byproducts = sorted(ex_fluxes.items(), key=lambda x: x[1], reverse=True)[:5]
            
            # --- Carbon Loss Calculation ---
            carbon_loss_idx = 0.0
            try:
                # Find carbon source reaction (e.g., EX_glc__D_e)
                carbon_uptake_flux = 0.0
                carbon_source_atoms = 0
                
                # Check for glucose as default if not found via generic search
                for ex_rxn in self.model.exchanges:
                    flux = fluxes[ex_rxn.id]
                    if flux < -1e-6: # Uptake
                        met = list(ex_rxn.metabolites.keys())[0]
                        c_count = met.elements.get('C', 0)
                        if c_count > 0:
                            carbon_uptake_flux += abs(flux) * c_count
                
                carbon_excreted_flux = 0.0
                for ex_rxn in self.model.exchanges:
                    flux = fluxes[ex_rxn.id]
                    if flux > 1e-6: # Excretion
                        met = list(ex_rxn.metabolites.keys())[0]
                        # Skip CO2 as it's inevitable but we often want to track organic loss
                        if met.id == 'co2_e': continue 
                        c_count = met.elements.get('C', 0)
                        carbon_excreted_flux += flux * c_count
                
                if carbon_uptake_flux > 0:
                    carbon_loss_idx = (carbon_excreted_flux / carbon_uptake_flux) * 100
            except:
                pass # Fallback to 0 if calculation fails
            
            # --- Shadow Price Extraction ---
            shadow_prices = {}
            try:
                # Extract top 50 shadow prices (highest absolute values)
                sp_series = solution.shadow_prices
                top_sp = sp_series.abs().sort_values(ascending=False).head(50)
                shadow_prices = {idx: sp_series[idx] for idx in top_sp.index}
            except:
                pass


            # Calculate Byproduct Analysis for Static Simulation
            # Use production rates (flux > 0) as concentration proxy
            production_rates = {k: v for k, v in fluxes.items() if v > 1e-4 and k.startswith('EX_')}
            byproduct_analysis = self.byproduct_analyst.analyze_impact(production_rates)
            
            return {
                "success": True,
                "growth_rate": growth_rate,
                "fluxes": fluxes,
                "byproducts": [{"id": k, "value": v} for k, v in top_byproducts],
                "carbon_loss_index": round(carbon_loss_idx, 2),
                "shadow_prices": shadow_prices,
                "status": solution.status,
                "byproduct_analysis": byproduct_analysis
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def simulate_dynamic(self, initial_glucose: float = 20.0, initial_biomass: float = 0.01, 
                        total_time: float = 24.0, time_step: float = 0.5, include_flux_history: bool = False) -> Dict:
        """
        Dynamic FBA (dFBA) simulation
        Simple batch fermentation model:
        dX/dt = mu * X
        dS/dt = v_s * X
        dP/dt = v_p * X
        """
        try:
            growth_rate_history = []
            byproduct_histories = {}
            glucose_history = []
            biomass_history = []
            time_points = []
            toxicity_events = []
            flux_history = []  # Store full flux snapshots
            
            # Initial conditions
            X = initial_biomass
            S = initial_glucose
            t = 0.0
            
            # Constants for uptake (Michaelis-Menten)
            Km = 0.5 # mmol/L
            Vmax_uptake = -10.0 # mmol/gDW/h (Negative for uptake)
            
            # Toxicity Thresholds (mmol/L)
            TOXICITY_MAP = {
                "EX_ac_e": 60.0,   # Acetate threshold
                "EX_lac__L_e": 40.0, # Lactate threshold
                "EX_etoh_e": 30.0    # Ethanol threshold
            }
            
            # Byproduct accumulation (mmol/L)
            P = {rid: 0.0 for rid in TOXICITY_MAP}
            toxicity_events = []
            
            logger.info(f"Starting dynamic simulation: steps={int(total_time/time_step)}")
            
            while t <= total_time and S > 0:
                step_idx = len(time_points)
                if step_idx % 5 == 0:
                    logger.info(f"Simulating time: {t:.1f}/{total_time}")

                time_points.append(round(t, 2))
                biomass_history.append(round(X, 4))
                glucose_history.append(round(S, 4))
                
                # 1. Update uptake rate based on S
                current_v_s = Vmax_uptake * (S / (Km + S))
                
                # 2. Apply current substrate constraint
                self.model.reactions.get_by_id("EX_glc__D_e").lower_bound = current_v_s
                
                # 3. Solve FBA
                solution = self.model.optimize()
                if solution.status != 'optimal':
                    growth_rate_history.append(0.0)
                    break
                    
                mu = solution.objective_value
                
                # --- Toxicity Inhibition Factor ---
                # mu = mu_base * Product(Ki / (Ki + Pi))
                inhibition_factor = 1.0
                for rid, threshold in TOXICITY_MAP.items():
                    if rid in byproduct_histories and len(byproduct_histories[rid]) > 0:
                        current_p = P.get(rid, 0.0)
                        inhibition_factor *= (threshold / (threshold + current_p))
                        if current_p > threshold * 0.8:
                            toxicity_events.append({"time": t, "byproduct": rid, "concentration": current_p})
                
                mu = mu * inhibition_factor
                growth_rate_history.append(sanitize_float(round(mu, 4)))
                
                # Capture current fluxes (Sparse Optimization & Type Safety)
                # Only analyze and store if requested to save massive bandwidth
                if include_flux_history:
                    # Ensure float conversion and handle NaNs
                    current_fluxes = {}
                    for k, v in solution.fluxes.items():
                        if abs(v) > 1e-3:
                            current_fluxes[k] = sanitize_float(v)
                    flux_history.append(current_fluxes)
                
                fluxes = solution.fluxes
                
                # 4. Record byproducts
                ex_fluxes = {r.id: fluxes[r.id] for r in self.model.exchanges if fluxes[r.id] > 1e-4}
                for rid, val in ex_fluxes.items():
                    if rid not in byproduct_histories:
                        byproduct_histories[rid] = [0.0] * (len(time_points) - 1)
                    byproduct_histories[rid].append(sanitize_float(round(val, 4)))
                    
                    # Accumulate concentration in the medium
                    if rid in P:
                        P[rid] += val * X * time_step
                
                # Ensure all byproducts have entry for this timepoint
                for rid in byproduct_histories:
                    if len(byproduct_histories[rid]) < len(time_points):
                        byproduct_histories[rid].append(0.0)

                # 5. Integrate (Euler)
                dt = time_step
                X_next = X + (mu * X * dt)
                S_next = S + (fluxes["EX_glc__D_e"] * X * dt)
                
                X = max(0, X_next)
                S = max(0, S_next)
                t += dt
            
            # Final Byproduct Analysis
            final_concentrations = {rid: history[-1] for rid, history in byproduct_histories.items()}
            byproduct_analysis = self.byproduct_analyst.analyze_impact(final_concentrations)

            return {
                "success": True,
                "time": time_points,
                "biomass": biomass_history,
                "glucose": glucose_history,
                "growth_rates": growth_rate_history,
                "byproducts": byproduct_histories,
                "flux_history": flux_history,
                "toxicity_alerts": toxicity_events[:10],
                "byproduct_analysis": byproduct_analysis  # New Analysis Data
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def simulate_fva(self, reaction_ids: Optional[List[str]] = None, fraction_of_optimum: float = 0.95) -> Dict:
        """
        Flux Variability Analysis (FVA)
        """
        try:
            from cobra.flux_analysis import flux_variability_analysis
            
            # If no specific reactions, focus on key metabolic ones to save time
            if not reaction_ids:
                # Top reactions with significantly high flux in standard FBA
                sol = self.model.optimize()
                if sol.status == 'optimal':
                    fluxes = sol.fluxes
                    # Filter reactions with absolute flux > 1.0 (arbitrary threshold for key reactions)
                    reaction_ids = [r.id for r in self.model.reactions if abs(fluxes[r.id]) > 1.0]
                else:
                    return {"success": False, "error": "Model not optimal for FVA"}

            fva_result = flux_variability_analysis(
                self.model, 
                reaction_list=reaction_ids[:50], # Limit to 50 for performance
                fraction_of_optimum=fraction_of_optimum
            )
            
            results = {}
            for rid, row in fva_result.iterrows():
                results[rid] = {
                    "minimum": round(row['minimum'], 4),
                    "maximum": round(row['maximum'], 4)
                }
                
            return {
                "success": True,
                "fva_results": results
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def simulate_production_envelope(self, target_rxn_id: str, points: int = 20) -> Dict:
        """
        Production Envelope analysis (Growth vs Target yield)
        """
        try:
            # Use model-specific biomass reaction if not explicitly provided
            biomass_id = "BIOMASS_Ec_iML1515_core_75p37M" if "iML1515" in self.model.id else "r_2111"
            
            envelope = production_envelope(
                self.model, 
                reactions=[biomass_id], 
                objective=target_rxn_id,
                points=points
            )
            
            result_data = []
            for _, row in envelope.iterrows():
                result_data.append({
                    "growth_rate": round(row[biomass_id], 4),
                    "min_flux": round(row['minimum'], 4),
                    "max_flux": round(row['maximum'], 4)
                })
                
            return {
                "success": True,
                "target_rxn": target_rxn_id,
                "data": result_data
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def simulate_moma(self) -> Dict:
        """
        MOMA (Minimization of Metabolic Adjustment)
        Typically used after knockouts to find a solution closer to the wild-type.
        """
        try:
            from cobra.flux_analysis import moma
            
            # Calculate MOMA solution
            # Note: cobrapy's moma usually needs a reference (wild-type) model or objective.
            # If we don't pass a solution, it uses the current model's wild-type state if possible.
            solution = moma(self.model)
            
            if solution.status != 'optimal':
                return {"success": False, "status": solution.status}

            fluxes = solution.fluxes.to_dict()
            growth_rate = solution.objective_value

            ex_fluxes = {r.id: fluxes[r.id] for r in self.model.exchanges if fluxes[r.id] > 1e-6}
            top_byproducts = sorted(ex_fluxes.items(), key=lambda x: x[1], reverse=True)[:5]
            
            return {
                "success": True,
                "growth_rate": growth_rate,
                "fluxes": fluxes,
                "byproducts": [{"id": k, "value": v} for k, v in top_byproducts],
                "status": solution.status,
                "method": "MOMA"
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def search_genes_reactions(self, query: str) -> List[Dict]:
        results = []
        query = query.lower()
        
        # Search genes
        for gene in self.model.genes:
            if query in gene.id.lower() or query in gene.name.lower():
                results.append({"id": gene.id, "name": gene.name, "type": "gene"})
        
        # Search reactions
        for rxn in self.model.reactions:
            if query in rxn.id.lower() or query in rxn.name.lower():
                results.append({"id": rxn.id, "name": rxn.name, "type": "reaction"})
                
        return results[:20]  # Limit results
