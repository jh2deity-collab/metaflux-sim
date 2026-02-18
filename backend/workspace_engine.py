import numpy as np
import cobra
from typing import Dict, List, Optional

class WorkspaceEngine:
    def __init__(self, model: cobra.Model):
        self.model = model

    def get_3d_projection(self, flux_data: Dict[str, float]) -> List[Dict]:
        """
        Project flux data into 3D space.
        Instead of heavy PCA, we use an intelligent mapping based on subsystems 
        to ensure biological meaning in the 3D space.
        """
        # Group reactions by subsystem
        subsystems = list(set([r.subsystem for r in self.model.reactions if r.subsystem]))
        subsystem_to_angle = {s: (i / len(subsystems)) * 2 * np.pi for i, s in enumerate(subsystems)}
        
        projections = []
        for rxn_id, flux in flux_data.items():
            if rxn_id not in self.model.reactions:
                continue
                
            rxn = self.model.reactions.get_by_id(rxn_id)
            ss = rxn.subsystem or "Other"
            
            # Use cylindrical coordinates to create clusters
            angle = subsystem_to_angle.get(ss, 0)
            radius = 5.0 + np.random.normal(0, 0.5) # Subsystem ring
            
            # Z-axis can represent flux magnitude or energy level
            z = np.log1p(abs(flux)) * (1 if flux >= 0 else -1)
            
            x = radius * np.cos(angle) + np.random.normal(0, 0.3)
            y = radius * np.sin(angle) + np.random.normal(0, 0.3)
            
            projections.append({
                "id": rxn_id,
                "name": rxn.name,
                "subsystem": ss,
                "x": float(x),
                "y": float(y),
                "z": float(z),
                "value": float(abs(flux))
            })
            
        return projections

    def serialize_workspace(self, 
                            config: Dict, 
                            knockouts: List[str], 
                            omics_data: Dict, 
                            results: Optional[Dict]) -> str:
        """
        Format the entire workspace state for download.
        """
        import json
        payload = {
            "version": "1.0",
            "metadata": {
                "created_at": "2026-02-18",
                "app": "MetaFlux-Sim"
            },
            "state": {
                "config": config,
                "knockouts": knockouts,
                "omics_data": omics_data,
                "last_results": results
            }
        }
        return json.dumps(payload, indent=2)
