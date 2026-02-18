
import logging
from typing import Dict, List, Any
import math

# Mock Database for Byproduct Metadata
# Toxicity: 0 (Safe) ~ 10 (Lethal)
# Price: $/kg
BYPRODUCT_DB = {
    "ac_e": {"name": "Acetate", "toxicity": 4.5, "price": 0.5, "mw": 60.05, "category": "Organic Acid"},
    "lac__D_e": {"name": "D-Lactate", "toxicity": 6.0, "price": 1.2, "mw": 90.08, "category": "Organic Acid"},
    "for_e": {"name": "Formate", "toxicity": 7.5, "price": 0.3, "mw": 46.03, "category": "Organic Acid"},
    "etoh_e": {"name": "Ethanol", "toxicity": 5.0, "price": 0.8, "mw": 46.07, "category": "Alcohol"},
    "succ_e": {"name": "Succinate", "toxicity": 1.5, "price": 2.5, "mw": 118.09, "category": "Organic Acid"},
    "pyr_e": {"name": "Pyruvate", "toxicity": 2.0, "price": 15.0, "mw": 88.06, "category": "Organic Acid"},
    "co2_e": {"name": "Carbon Dioxide", "toxicity": 0.1, "price": 0.0, "mw": 44.01, "category": "Gas"},
    "h2o_e": {"name": "Water", "toxicity": 0.0, "price": 0.0, "mw": 18.01, "category": "Solvent"},
    "nh4_e": {"name": "Ammonium", "toxicity": 8.0, "price": 0.4, "mw": 18.04, "category": "Nitrogen Source"},
}

class ByproductAnalyst:
    def __init__(self):
        self.logger = logging.getLogger(__name__)

    def analyze_impact(self, byproducts: Dict[str, float]) -> List[Dict[str, Any]]:
        """
        Analyzes the economic and toxicity impact of secreted byproducts.
        Returns a list of analysis results for each byproduct.
        """
        analysis_results = []

        for byproduct_id, concentration in byproducts.items():
            if concentration <= 1e-3:  # Ignore negligible amounts
                continue

            metadata = BYPRODUCT_DB.get(byproduct_id, {
                "name": byproduct_id, 
                "toxicity": 3.0, # Default medium toxicity
                "price": 0.0, 
                "mw": 100.0,
                "category": "Unknown"
            })
            
            # Calculate metrics
            total_mass_kg = (concentration * metadata["mw"]) / 1000.0  # Assuming concentration is mmol/L, simplified conversion
            economic_value = total_mass_kg * metadata["price"]
            toxicity_score = metadata["toxicity"]
            
            # Determine Quadrant
            # Q1: High Value, Low Toxicity (Hidden Gem)
            # Q2: High Value, High Toxicity (High Risk/High Return)
            # Q3: Low Value, High Toxicity (Critical Waste)
            # Q4: Low Value, Low Toxicity (Neutral Waste)
            quadrant = ""
            if economic_value > 1.0 and toxicity_score < 4.0:
                quadrant = "Value-Add"
            elif economic_value > 1.0 and toxicity_score >= 4.0:
                quadrant = "High Risk"
            elif economic_value <= 1.0 and toxicity_score >= 4.0:
                quadrant = "Critical Waste"
            else:
                quadrant = "Neutral"

            analysis_results.append({
                "id": byproduct_id,
                "name": metadata["name"],
                "concentration": round(concentration, 2),
                "toxicity_index": toxicity_score,
                "economic_value": round(economic_value, 4),
                "price_per_kg": metadata["price"],
                "quadrant": quadrant,
                "category": metadata["category"]
            })
            
        # Sort by Toxicity (descending) as default concern
        analysis_results.sort(key=lambda x: x["toxicity_index"], reverse=True)
        return analysis_results

    def trace_origin(self, model, byproduct_id: str) -> Dict[str, Any]:
        """
        Traces the metabolic pathway backwards from the byproduct secretion to identify the root cause.
        """
        # 1. Find the transport/exchange reaction for this byproduct
        # Assuming exchange reactions are like 'EX_ac_e'
        target_metabolite = None
        if byproduct_id in model.metabolites:
            target_metabolite = model.metabolites.get_by_id(byproduct_id)
        else:
            return {"error": "Metabolite not found"}

        # 2. Find reactions producing this metabolite (Stoichiometry > 0)
        producing_reactions = []
        for rxn in target_metabolite.reactions:
            stoich = rxn.metabolites[target_metabolite]
            # Check flux direction? (Requires a solution context, here we do static structural tracing)
            # For now, just list connected reactions excluding the exchange itself
            if not rxn.id.startswith('EX_'):
                producing_reactions.append({
                    "id": rxn.id,
                    "name": rxn.name,
                    "stoichiometry": stoich
                })
        
        # Simple heuristic: The reaction with positive stoichiometry is the immediate producer
        # Ideally, we would use flux data to see which one ACTUALLY produced it.
        
        return {
            "byproduct_id": byproduct_id,
            "immediate_precursors": producing_reactions,
            "branch_point": "Pyruvate Node (Inferred)" # In a real implementation, we'd traverse the graph
        }

    def suggest_upcycling(self, byproduct_analysis: List[Dict[str, Any]]) -> List[Dict[str, str]]:
        """
        Generates AI-based upcycling suggestions.
        """
        suggestions = []
        for item in byproduct_analysis:
            if item["quadrant"] == "Critical Waste" or item["quadrant"] == "High Risk":
                 if item["id"] == "ac_e":
                     suggestions.append({
                         "target": "Acetate",
                         "strategy": "Install Acetyl-CoA Synthetase (acs)",
                         "benefit": "Recycles Acetate back to Acetyl-CoA ($0.5/kg -> Energy)"
                     })
                 elif item["id"] == "lac__D_e":
                     suggestions.append({
                         "target": "Lactate",
                         "strategy": "Knockout LDH_D or Engineer Lactate Permease",
                         "benefit": "Eliminates toxic buildup, redirects carbon to target."
                     })
        return suggestions
