from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
from app.routers.produce import get_current_user
from app.database import produce_collection, prices_collection, settings
from bson import ObjectId
import statistics
from groq import Groq

router = APIRouter(prefix="/api/profit-estimator", tags=["profit_estimator"])

class ProfitEstimationInput(BaseModel):
    produce_id: str
    cost_per_unit: float  # Cost in Rs. per kg
    area_size: Optional[float] = None  # Area in acres (optional)
    expected_yield: Optional[float] = None  # Expected yield in kg (optional)
    fertilizer_cost: Optional[float] = 0
    seed_cost: Optional[float] = 0
    water_cost: Optional[float] = 0
    labor_cost: Optional[float] = 0

class ProfitEstimationResponse(BaseModel):
    produce_name: str
    current_price: float
    predicted_price_range: dict
    total_input_cost: float
    expected_revenue: Optional[float]
    expected_profit: Optional[float]
    profit_likelihood: str  # "High", "Medium", "Low"
    best_selling_day: str
    price_trend: str  # "Rising", "Falling", "Stable"
    weather_impact: str
    ai_recommendation: str
    market_insights: dict

@router.post("/estimate", response_model=ProfitEstimationResponse)
async def estimate_profit(
    estimation_input: ProfitEstimationInput,
    current_user: dict = Depends(get_current_user)
):
    """
    Estimate potential profit or loss for a crop based on market prices, 
    weather, and input costs.
    """
    # Get produce information
    produce = await produce_collection.find_one({"_id": ObjectId(estimation_input.produce_id)})
    if not produce:
        raise HTTPException(status_code=404, detail="Produce not found")
    
    # Get 7-day price history
    seven_days_ago = datetime.now() - timedelta(days=7)
    price_history = []
    async for price in prices_collection.find({
        "produce_id": ObjectId(estimation_input.produce_id),
        "date": {"$gte": seven_days_ago}
    }).sort("date", 1):
        price_history.append(price)
    
    if len(price_history) < 2:
        raise HTTPException(
            status_code=400, 
            detail="Insufficient price history data. Need at least 2 days of data."
        )
    
    # Calculate price statistics
    prices = [entry["price"] for entry in price_history]
    current_price = prices[-1] if prices else produce.get("latest_price", 0)
    avg_price = statistics.mean(prices)
    min_price = min(prices)
    max_price = max(prices)
    
    # Calculate price trend
    if len(prices) >= 3:
        recent_avg = statistics.mean(prices[-3:])
        older_avg = statistics.mean(prices[:3])
        price_change_percent = ((recent_avg - older_avg) / older_avg) * 100 if older_avg > 0 else 0
        
        if price_change_percent > 5:
            price_trend = "Rising"
        elif price_change_percent < -5:
            price_trend = "Falling"
        else:
            price_trend = "Stable"
    else:
        price_trend = "Stable"
    
    # Predict price range (simple moving average + trend)
    if price_trend == "Rising":
        predicted_min = avg_price * 1.02
        predicted_max = max_price * 1.1
    elif price_trend == "Falling":
        predicted_min = min_price * 0.9
        predicted_max = avg_price * 0.98
    else:
        predicted_min = avg_price * 0.95
        predicted_max = avg_price * 1.05
    
    # Calculate best selling day based on historical data
    # Find day with highest prices
    day_prices = {}
    for entry in price_history:
        day_name = entry["date"].strftime("%A")
        if day_name not in day_prices:
            day_prices[day_name] = []
        day_prices[day_name].append(entry["price"])
    
    best_day = "Monday"  # Default
    if day_prices:
        avg_by_day = {day: statistics.mean(prices) for day, prices in day_prices.items()}
        best_day = max(avg_by_day, key=avg_by_day.get)
    
    # Calculate total input cost
    total_input_cost = (
        estimation_input.cost_per_unit +
        estimation_input.fertilizer_cost +
        estimation_input.seed_cost +
        estimation_input.water_cost +
        estimation_input.labor_cost
    )
    
    # Calculate expected revenue and profit (if yield is provided)
    expected_revenue = None
    expected_profit = None
    if estimation_input.expected_yield:
        expected_revenue = predicted_max * estimation_input.expected_yield
        expected_profit = expected_revenue - (total_input_cost * estimation_input.expected_yield)
    
    # Determine profit likelihood
    profit_margin = ((predicted_max - total_input_cost) / total_input_cost) * 100 if total_input_cost > 0 else 0
    
    if profit_margin > 30:
        profit_likelihood = "High"
    elif profit_margin > 10:
        profit_likelihood = "Medium"
    else:
        profit_likelihood = "Low"
    
    # Weather impact (simplified)
    weather_impact = "Favorable conditions expected for the next week"
    
    # Get AI recommendation using Groq
    ai_recommendation = await get_ai_recommendation(
        produce["name"],
        current_price,
        predicted_min,
        predicted_max,
        price_trend,
        profit_likelihood,
        total_input_cost
    )
    
    # Market insights
    volatility = statistics.stdev(prices) if len(prices) > 1 else 0
    market_insights = {
        "volatility": round(volatility, 2),
        "price_stability": "Low" if volatility > 10 else "Medium" if volatility > 5 else "High",
        "days_analyzed": len(price_history),
        "price_change_7d": round(((current_price - prices[0]) / prices[0]) * 100, 2) if prices[0] > 0 else 0
    }
    
    return ProfitEstimationResponse(
        produce_name=produce["name"],
        current_price=current_price,
        predicted_price_range={
            "min": round(predicted_min, 2),
            "max": round(predicted_max, 2),
            "avg": round((predicted_min + predicted_max) / 2, 2)
        },
        total_input_cost=round(total_input_cost, 2),
        expected_revenue=round(expected_revenue, 2) if expected_revenue else None,
        expected_profit=round(expected_profit, 2) if expected_profit else None,
        profit_likelihood=profit_likelihood,
        best_selling_day=best_day,
        price_trend=price_trend,
        weather_impact=weather_impact,
        ai_recommendation=ai_recommendation,
        market_insights=market_insights
    )

async def get_ai_recommendation(
    produce_name: str,
    current_price: float,
    predicted_min: float,
    predicted_max: float,
    price_trend: str,
    profit_likelihood: str,
    total_cost: float
) -> str:
    """Get AI-powered recommendation using Groq"""
    try:
        if not settings.groq_api_key or settings.groq_api_key == "your-groq-api-key-here":
            return "AI recommendation unavailable. Please check API configuration."
        
        client = Groq(api_key=settings.groq_api_key)
        
        prompt = f"""As an agricultural market expert, provide a brief recommendation (2-3 sentences) for a farmer growing {produce_name}.

Current market situation:
- Current price: Rs. {current_price:.2f}/kg
- Predicted price range: Rs. {predicted_min:.2f} - Rs. {predicted_max:.2f}/kg
- Price trend: {price_trend}
- Profit likelihood: {profit_likelihood}
- Total input cost per kg: Rs. {total_cost:.2f}

Give practical advice on whether to sell now or wait, and any market timing suggestions."""

        response = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert agricultural economist helping farmers make profitable decisions."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=200
        )
        
        return response.choices[0].message.content.strip()
    
    except Exception as e:
        print(f"Error getting AI recommendation: {e}")
        return "AI recommendation temporarily unavailable."
