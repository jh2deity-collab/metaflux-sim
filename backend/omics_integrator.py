import cobra
from typing import Dict, List, Optional
import numpy as np

class OmicsIntegrator:
    def __init__(self, model: cobra.Model):
        self.model = model

    def apply_omics_data(self, gene_expression: Dict[str, float], normalization_factor: float = 1.0):
        """
        Apply gene expression data to model reaction bounds.
        Simple approach: V_max = k * expression
        """
        # Map gene expression to reactions using GPR rules
        reaction_expression = self._map_gene_to_reaction(gene_expression)
        
        # Apply bounds to model
        for rxn_id, expression in reaction_expression.items():
            if rxn_id in self.model.reactions:
                rxn = self.model.reactions.get_by_id(rxn_id)
                # Normalize expression to a reasonable flux bound (e.g., max 1000)
                bound = expression * normalization_factor
                
                # Apply as upper/lower bound based on directionality
                if rxn.upper_bound > 0:
                    rxn.upper_bound = min(rxn.upper_bound, bound)
                if rxn.lower_bound < 0:
                    rxn.lower_bound = max(rxn.lower_bound, -bound)
        
        return self.model

    def _map_gene_to_reaction(self, gene_expression: Dict[str, float]) -> Dict[str, float]:
        """
        Evaluate GPR rules to find reaction-level expression levels.
        AND rules -> min(expressions)
        OR rules -> sum(expressions)
        """
        reaction_expression = {}
        
        for rxn in self.model.reactions:
            if not rxn.gene_reaction_rule:
                continue
                
            try:
                # Simple GPR evaluation
                # This is a simplified version. CobraPy has internal tools for this, 
                # but we implement a robust mapping for common cases.
                expr_value = self._evaluate_gpr(rxn.gene_reaction_rule, gene_expression)
                if expr_value > 0:
                    reaction_expression[rxn.id] = expr_value
            except Exception as e:
                # print(f"Error evaluating GPR for {rxn.id}: {e}")
                pass
                
        return reaction_expression

    def _evaluate_gpr(self, rule: str, gene_expression: Dict[str, float]) -> float:
        """
        Recursive evaluation of GPR strings.
        Example: (G1 AND G2) OR G3
        """
        if not rule:
            return 0.0
            
        # Clean rule
        rule = rule.replace('(', ' ( ').replace(')', ' ) ')
        tokens = rule.split()
        
        def parse_expression(tokens):
            if not tokens:
                return 0.0
                
            # Handle OR groups (lowest precedence)
            if 'or' in [t.lower() for t in tokens]:
                parts = []
                current_part = []
                depth = 0
                for t in tokens:
                    if t == '(': depth += 1
                    elif t == ')': depth -= 1
                    
                    if depth == 0 and t.lower() == 'or':
                        parts.append(current_part)
                        current_part = []
                    else:
                        current_part.append(t)
                parts.append(current_part)
                return sum(parse_expression(p) for p in parts)
            
            # Handle AND groups
            if 'and' in [t.lower() for t in tokens]:
                parts = []
                current_part = []
                depth = 0
                for t in tokens:
                    if t == '(': depth += 1
                    elif t == ')': depth -= 1
                    
                    if depth == 0 and t.lower() == 'and':
                        parts.append(current_part)
                        current_part = []
                    else:
                        current_part.append(t)
                parts.append(current_part)
                results = [parse_expression(p) for p in parts]
                # If any mandatory subunit is missing (0), set to 0. Otherwise use min.
                return min(results) if all(r > 0 for r in results) else 0.0

            # Strip parentheses
            if tokens[0] == '(' and tokens[-1] == ')':
                return parse_expression(tokens[1:-1])
                
            # Leaf node: Gene ID
            gene_id = tokens[0]
            return gene_expression.get(gene_id, 0.01) # Default tiny value for unknown genes if baseline exists

        return parse_expression(tokens)
