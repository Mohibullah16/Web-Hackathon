from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
import requests
from groq import Groq
from app.database import settings
from app.routers.produce import get_current_user

router = APIRouter(prefix="/api", tags=["External APIs"])


class PriceHistoryItem(BaseModel):
    date: str
    price: float
    region: str


class AdviceRequest(BaseModel):
    produce_name: str
    price_history: List[PriceHistoryItem]
    weather_data: Dict[str, Any]  # {"temp": 25, "condition": "Clear", "humidity": 60}
    city: str


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    produce_context: str
    system_prompt: str
    conversation_history: List[ChatMessage]


@router.get("/weather")
async def get_weather(city: str = Query(..., description="City name"), current_user: dict = Depends(get_current_user)):
    """
    Get current weather data for a city using OpenWeatherMap API.
    """
    if not settings.openweather_api_key or settings.openweather_api_key == "your-openweathermap-api-key-here":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Weather API key not configured"
        )
    
    try:
        url = f"http://api.openweathermap.org/data/2.5/weather"
        params = {
            "q": city,
            "appid": settings.openweather_api_key,
            "units": "metric"
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        return {
            "city": city,
            "temperature": data["main"]["temp"],
            "feels_like": data["main"]["feels_like"],
            "humidity": data["main"]["humidity"],
            "condition": data["weather"][0]["main"],
            "description": data["weather"][0]["description"],
            "icon": data["weather"][0]["icon"]
        }
    
    except requests.RequestException as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to fetch weather data: {str(e)}"
        )


@router.post("/advice")
async def get_smart_advice(advice_request: AdviceRequest, current_user: dict = Depends(get_current_user)):
    """
    Get AI-generated agricultural advice based on price trends and weather data.
    Uses Groq API for LLM-based recommendations.
    """
    if not settings.groq_api_key or settings.groq_api_key == "your-groq-api-key-here":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Groq API key not configured"
        )
    
    try:
        print(f"Generating advice for: {advice_request.produce_name}")
        print(f"Price history count: {len(advice_request.price_history)}")
        
        # Format price history for the prompt
        price_trend = ", ".join([f"{p.date}: Rs.{p.price}" for p in advice_request.price_history])
        
        # Construct the prompt
        prompt = f"""As an agricultural advisor for farmers in Pakistan, provide a short, actionable piece of advice (2-3 sentences) based on this data:

The price of {advice_request.produce_name} has a 7-day trend of [{price_trend}].

The current weather in {advice_request.city} is {advice_request.weather_data.get('condition', 'unknown')} with a temperature of {advice_request.weather_data.get('temperature', 'N/A')}°C and humidity of {advice_request.weather_data.get('humidity', 'N/A')}%.

What should the farmer do? Consider market timing, storage, and weather impact on crop quality."""

        print(f"Calling Groq API with prompt length: {len(prompt)}")
        
        # Call Groq API - initialize with explicit parameters only
        try:
            from groq import Groq as GroqClient
            client = GroqClient(api_key=settings.groq_api_key)
            print("Groq client created successfully")
        except TypeError as init_error:
            print(f"Groq init error: {init_error}")
            # Fallback: try with just api_key as positional arg
            client = GroqClient(settings.groq_api_key)
            print("Groq client created with positional arg")
        
        try:
            chat_completion = client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert agricultural advisor in Pakistan. Provide practical, concise advice."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                model="llama-3.1-8b-instant",
                temperature=0.7,
                max_tokens=200
            )
            
            print("Groq API call successful")
            advice = chat_completion.choices[0].message.content
            print(f"Generated advice: {advice[:100]}...")
            
            return {
                "advice": advice,
                "produce_name": advice_request.produce_name,
                "city": advice_request.city
            }
        except Exception as groq_error:
            print(f"Groq API Error Type: {type(groq_error).__name__}")
            print(f"Groq API Error Message: {str(groq_error)}")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Groq API error: {str(groq_error)}"
            )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"General Error Type: {type(e).__name__}")
        print(f"General Error Message: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to generate advice: {str(e)}"
        )


@router.post("/chat")
async def chat_with_ai(chat_request: ChatRequest, current_user: dict = Depends(get_current_user)):
    """
    Chat with AI assistant about agriculture, crops, and produce prices.
    The AI is context-aware of the current produce database.
    """
    if not settings.groq_api_key or settings.groq_api_key == "your-groq-api-key-here":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Groq API key not configured"
        )
    
    try:
        print(f"Chat request from user: {current_user.get('username', 'unknown')}")
        print(f"User message: {chat_request.message}")
        
        # Build conversation history for Groq
        messages = [
            {
                "role": "system",
                "content": chat_request.system_prompt
            }
        ]
        
        # Add conversation history (limit to last 6 messages for context window)
        for msg in chat_request.conversation_history[-6:]:
            messages.append({
                "role": msg.role,
                "content": msg.content
            })
        
        # Add the new user message
        messages.append({
            "role": "user",
            "content": chat_request.message
        })
        
        print(f"Sending {len(messages)} messages to Groq API")
        
        # Call Groq API
        try:
            from groq import Groq as GroqClient
            client = GroqClient(api_key=settings.groq_api_key)
        except TypeError:
            client = GroqClient(settings.groq_api_key)
        
        chat_completion = client.chat.completions.create(
            messages=messages,
            model="openai/gpt-oss-20b",  # Using llama model as it's available on Groq
            temperature=0.7,
            max_tokens=500,
            top_p=0.9
        )
        
        response_text = chat_completion.choices[0].message.content
        print(f"AI response generated: {response_text[:100]}...")
        
        return {
            "response": response_text,
            "model": "llama-3.1-8b-instant"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Chat Error Type: {type(e).__name__}")
        print(f"Chat Error Message: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to generate chat response: {str(e)}"
        )
