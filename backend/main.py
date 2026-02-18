from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import os
import json
from openai import OpenAI
from dotenv import load_dotenv
from simulator import MetabolicSimulator
from omics_integrator import OmicsIntegrator
from strain_designer import StrainDesigner
from workspace_engine import WorkspaceEngine

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = FastAPI(title="MetaFlux-Sim API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global simulator instance
simulators: Dict[str, MetabolicSimulator] = {}
MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")

class OmicsIntegrationRequest(BaseModel):
    model_id: str
    gene_expression: Dict[str, float]
    normalization_factor: float = 1.0

class Analysis3DRequest(BaseModel):
    model_id: str
    fluxes: Dict[str, float]

class DesignOptimizationRequest(BaseModel):
    model_id: str
    target_rxn_id: str
    max_knockouts: int = 2
    min_growth: float = 0.1

class SimulationRequest(BaseModel):
    model_id: str
    carbon_source: str = "glc__D"
    uptake_rate: float = -10.0
    aerobic: bool = True
    knockouts: List[str] = []
    overexpressions: Dict[str, float] = {}
    method: str = "fba" # "fba" or "moma"

class FVARequest(BaseModel):
    model_id: str
    carbon_source: str = "glc__D"
    uptake_rate: float = -10.0
    aerobic: bool = True
    knockouts: List[str] = []
    fraction_of_optimum: float = 0.95

class DynamicSimulationRequest(BaseModel):
    model_id: str
    initial_glucose: float = 20.0
    initial_biomass: float = 0.01
    total_time: float = 24.0
    time_step: float = 0.5
    knockouts: List[str] = []
    include_flux_history: bool = False

class ProductionEnvelopeRequest(BaseModel):
    model_id: str
    target_rxn_id: str
    carbon_source: str = "glc__D"
    uptake_rate: float = -10.0
    aerobic: bool = True
    knockouts: List[str] = []

class ChatRequest(BaseModel):
    message: str
    model_id: Optional[str] = None
    context: Optional[Dict] = None

@app.post("/load-model")
async def load_model(model_id: str = Body(..., embed=True)):
    file_name = f"{model_id}.json"
    file_path = os.path.join(MODELS_DIR, file_name)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"Model {model_id} not found")
    
    try:
        simulators[model_id] = MetabolicSimulator(file_path)
        return {"status": "success", "message": f"Model {model_id} loaded"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/simulate")
async def simulate(req: SimulationRequest):
    if req.model_id not in simulators:
        await load_model(req.model_id)
        
    sim = simulators[req.model_id]
    sim.apply_environment(req.carbon_source, req.uptake_rate, req.aerobic)
    sim.apply_modifications(req.knockouts, req.overexpressions)
    
    # Offload to threadpool
    from starlette.concurrency import run_in_threadpool
    if req.method.lower() == "moma":
        result = await run_in_threadpool(sim.simulate_moma)
    else:
        result = await run_in_threadpool(sim.simulate)
    return result

@app.post("/simulate-fva")
async def simulate_fva(req: FVARequest):
    if req.model_id not in simulators:
        await load_model(req.model_id)
        
    sim = simulators[req.model_id]
    sim.apply_environment(req.carbon_source, req.uptake_rate, req.aerobic)
    sim.apply_modifications(req.knockouts, {})
    
    # Offload to threadpool
    from starlette.concurrency import run_in_threadpool
    result = await run_in_threadpool(sim.simulate_fva, fraction_of_optimum=req.fraction_of_optimum)
    return result

@app.post("/simulate-dynamic")
async def simulate_dynamic(req: DynamicSimulationRequest):
    print(f"Received dynamic simulation request for model: {req.model_id}, history={req.include_flux_history}")
    if req.model_id not in simulators:
        print(f"Loading model {req.model_id}...")
        await load_model(req.model_id)
        
    sim = simulators[req.model_id]
    # Apply modifications before dynamic run
    sim.reset_model()
    sim.apply_modifications(req.knockouts, {})
    
    print("Starting simulation in simulator.py...")
    # Offload to threadpool
    from starlette.concurrency import run_in_threadpool
    result = await run_in_threadpool(
        sim.simulate_dynamic,
        initial_glucose=req.initial_glucose,
        initial_biomass=req.initial_biomass,
        total_time=req.total_time,
        time_step=req.time_step,
        include_flux_history=req.include_flux_history
    )
    print("Simulation completed. Returning result.")
    return result

@app.post("/integrate-omics")
async def integrate_omics(req: OmicsIntegrationRequest):
    if req.model_id not in simulators:
        await load_model(req.model_id)
        
    sim = simulators[req.model_id]
    
    # Reset model to baseline before applying omics
    sim.reset_model()
    
    integrator = OmicsIntegrator(sim.model)
    updated_model = integrator.apply_omics_data(req.gene_expression, req.normalization_factor)
    
    # Run FBA with omics constraints to see impact
    result = sim.simulate()
    result["message"] = "오믹스 데이터가 대사 모델에 성공적으로 통합되었습니다."
    return result

@app.post("/optimize-design")
async def optimize_design(req: DesignOptimizationRequest):
    if req.model_id not in simulators:
        await load_model(req.model_id)
        
    sim = simulators[req.model_id]
    designer = StrainDesigner(sim.model)
    
    # Use model-specific biomass reaction
    biomass_id = "BIOMASS_Ec_iML1515_core_75p37M" if "iML1515" in req.model_id else "r_2111"
    
    result = designer.optimize_knockouts(
        target_rxn_id=req.target_rxn_id,
        biomass_rxn_id=biomass_id,
        max_knockouts=req.max_knockouts,
        fraction_of_optimum=req.min_growth
    )
    return result

@app.post("/analyze-3d-space")
async def analyze_3d_space(req: Analysis3DRequest):
    if req.model_id not in simulators:
        await load_model(req.model_id)
        
    sim = simulators[req.model_id]
    engine = WorkspaceEngine(sim.model)
    
    projections = engine.get_3d_projection(req.fluxes)
    return {"success": True, "projections": projections}

@app.post("/production-envelope")
async def get_production_envelope(req: ProductionEnvelopeRequest):
    if req.model_id not in simulators:
        await load_model(req.model_id)
        
    sim = simulators[req.model_id]
    sim.apply_environment(req.carbon_source, req.uptake_rate, req.aerobic)
    sim.apply_modifications(req.knockouts, {})
    
    result = sim.simulate_production_envelope(target_rxn_id=req.target_rxn_id)
    return result

@app.get("/search")
async def search(model_id: str, query: str):
    if model_id not in simulators:
        await load_model(model_id)
    
    return simulators[model_id].search_genes_reactions(query)

@app.post("/chat")
async def chat(req: ChatRequest):
    message = req.message
    model_id = req.model_id or "iML1515"
    context = req.context or {}
    
    # 1. 시뮬레이션 데이터 추출 (Comparison Mode 지원)
    current = context.get("current")
    baseline = context.get("baseline")
    
    current_growth = current.get("growth_rate", 0) if current else 0
    current_byproducts = current.get("byproducts", []) if current else []
    
    # Advanced Metrics Extraction
    carbon_loss_idx = current.get("carbon_loss_index", 0) if current else 0
    shadow_prices = current.get("shadow_prices", {}) if current else {}
    toxicity_alerts = context.get("dynamic_results", {}).get("toxicity_alerts", []) if context else []
    envelope_data = context.get("envelope", {}) if context else {}

    baseline_growth = baseline.get("growth_rate", 0) if baseline else None
    baseline_byproducts = baseline.get("byproducts", []) if baseline else []

    comparison_info = f"""
[기본 분석 데이터]
- 현재 성장률: {current_growth:.4f}
- 현재 부산물: {current_byproducts}
- 탄소 유실 지수 (CLI): {carbon_loss_idx}%
- 주요 병목 대사물질 (Shadow Prices): {shadow_prices}
"""
    if toxicity_alerts:
        comparison_info += f"- 대사 독성 경고: {toxicity_alerts}\n"
    if envelope_data:
        comparison_info += f"- 생산 포괄도 요약: Max Yield={envelope_data.get('max_yield', 'N/A')}\n"

    if baseline_growth is not None:
        growth_diff = current_growth - baseline_growth
        comparison_info += f"""
[비교 분석 모드]
- 기준 성장률 (Baseline): {baseline_growth:.4f}
- 성장률 변화량: {growth_diff:+.4f}
- 기준 부산물: {baseline_byproducts}
"""

    system_prompt = f"""
당신은 세계 최고의 미생물 대사공학 및 합성생물학 전문가 'MetaFlux AI'입니다. 
당신은 리포트 작성 시 다음의 고도화된 5대 분석 지표를 반드시 반영해야 합니다:

1. **Carbon Loss Index (CLI)**: 탄소 유실율을 기반으로 한 대사 효율성 진단.
2. **Shadow Price Analysis**: 전체 대사 흐름의 핵심 병목(Metabolic Bottlenecks) 식별.
3. **Production Envelope**: 성장과 생산의 트레이드오프 관계 및 최적 조업점 제안.
4. **Toxicity Prediction**: 부산물 축적에 따른 독성 영향 및 회피 전략.
5. **AI Rerouting Strategy**: 병목을 우회하기 위한 유전자 '과발현(Overexpression)' 및 '우회 경로' 설계 제안.

분석 대상 모델: {model_id} ({ "대장균 iML1515" if "iML1515" in model_id else "효모 iMM904" })

시뮬레이션 컨텍스트:
{comparison_info}

보고서 작성 지침:
- 단순히 수치를 나열하지 말고, CLI와 Shadow Price 사이의 상관관계를 통해 "왜 탄소가 저기로 흐르는지"를 대사공학적으로 추론하세요.
- **Rerouting 전략 섹션**에서는 Shadow Price가 높은 병목을 해소하기 위한 구체적인 유전자 강화(Up-regulation) 대상을 학술적 근거와 함께 제시하세요.
- 독성 알림이 있는 경우, 배양 중반부의 전이(Switch)를 막기 위한 pH 조절이나 feeding 전략을 포함하세요.
- 모든 답변은 한국어로 작성하며, 전문 연구원 수준의 격조 높은 문체를 사용하세요.
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ],
            temperature=0.7,
            max_tokens=1000
        )
        return {"response": response.choices[0].message.content}
    except Exception as e:
        print(f"LLM Error: {e}")
        return {"response": "죄송합니다. 현재 AI 엔진에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요."}
    except Exception as e:
        print(f"LLM Error: {e}")
        return {"response": "죄송합니다. 현재 AI 엔진에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요."}

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
