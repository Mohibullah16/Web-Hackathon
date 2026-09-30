# Smart Agriculture Market Tracker
# Won 2nd Place, Hacktober Fest Web Innovator Hackathon 
A full-stack web application for tracking agricultural produce prices and providing smart farming advice using AI.

## Features

### Backend (FastAPI)
- 🔐 JWT-based authentication with role-based access (Admin/Farmer)
- 📊 CRUD operations for produce items and price entries
- 🌤️ Weather API integration (OpenWeatherMap)
- 🤖 AI-powered farming advice using Groq LLM
- 💬 Community forum with posts and comments
- 📈 7-day price history tracking

### Frontend (React + Mantine UI)
- 🎨 Modern, responsive UI with Mantine components
- 📊 Interactive price trend charts with Recharts
- 🌦️ Real-time weather display
- 💡 Smart advice based on price trends and weather
- 👥 Community forum for farmer discussions
- 🔒 Protected routes with role-based access

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **MongoDB** - NoSQL database with Motor (async driver)
- **Pydantic** - Data validation
- **JWT** - Authentication
- **Groq API** - AI model for farming advice
- **OpenWeatherMap API** - Weather data

### Frontend
- **React** - UI library
- **Vite** - Build tool
- **Mantine** - Component library
- **Recharts** - Data visualization
- **Axios** - HTTP client
- **React Router** - Navigation

## Project Structure

```
/backend
├── /app
│   ├── /routers          # API endpoints
│   │   ├── auth.py       # Authentication
│   │   ├── produce.py    # Produce & prices CRUD
│   │   ├── external_apis.py  # Weather & AI
│   │   └── forum.py      # Community forum
│   ├── /models           # Pydantic models
│   │   ├── user.py
│   │   ├── produce.py
│   │   └── forum.py
│   ├── /utils            # Utilities
│   │   ├── hashing.py    # Password hashing
│   │   └── jwt_handler.py # JWT operations
│   ├── database.py       # MongoDB connection
│   └── main.py           # FastAPI app
├── .env                  # Environment variables
└── requirements.txt

/frontend
├── /src
│   ├── /api              # Axios configuration
│   ├── /components       # Reusable components
│   ├── /context          # React context (auth)
│   ├── /pages            # Page components
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── package.json
└── vite.config.js
```

## Setup Instructions

### Prerequisites
- Python 3.9+
- Node.js 16+
- MongoDB (local or cloud instance)
- OpenWeatherMap API key
- Groq API key

### Backend Setup

1. **Navigate to backend directory:**
   ```powershell
   cd backend
   ```

2. **Create a virtual environment:**
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

3. **Install dependencies:**
   ```powershell
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   - Open `.env` file and update the following:
     ```env
     MONGODB_URL=mongodb://localhost:27017
     DATABASE_NAME=smart_agriculture_db
     SECRET_KEY=your-secure-secret-key-here
     OPENWEATHER_API_KEY=your-openweathermap-api-key
     GROQ_API_KEY=your-groq-api-key
     ```

5. **Run MongoDB:**
   - Make sure MongoDB is running locally or use MongoDB Atlas

6. **Start the backend server:**
   ```powershell
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   - API will be available at: http://localhost:8000
   - API documentation: http://localhost:8000/docs

### Frontend Setup

1. **Navigate to frontend directory:**
   ```powershell
   cd frontend
   ```

2. **Install dependencies:**
   ```powershell
   npm install
   ```

3. **Start the development server:**
   ```powershell
   npm run dev
   ```
   - App will be available at: http://localhost:5173

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT token

### Produce & Prices (Protected)
- `POST /produce/` - Add new produce (Admin only)
- `POST /produce/prices` - Add price entry (Admin only)
- `GET /produce/` - Get all produce with latest prices
- `GET /produce/{item_id}/history` - Get 7-day price history

### External APIs (Protected)
- `GET /api/weather?city={city}` - Get weather data
- `POST /api/advice` - Get AI farming advice

### Forum (Protected)
- `POST /forum/posts` - Create new post
- `GET /forum/posts` - Get all posts
- `GET /forum/posts/{post_id}` - Get post details with comments
- `POST /forum/posts/{post_id}/comments` - Add comment to post

## User Roles

### Farmer
- View produce prices and trends
- Get weather information
- Request AI farming advice
- Participate in forum discussions

### Admin
- All farmer permissions
- Add new produce items
- Add/update price entries
- Manage market data

## Usage Guide

### For Farmers:
1. Register as a farmer
2. Login to access the dashboard
3. View current market prices
4. Click "View Trend" to see 7-day price history
5. Click "Get Advice" for AI-powered recommendations
6. Visit the forum to discuss with other farmers

### For Admins:
1. Register as an admin
2. Login to access admin dashboard
3. Add new produce items
4. Add daily price entries for each produce
5. Monitor market trends
6. Moderate forum discussions

## Environment Variables

### Backend (.env)
```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=smart_agriculture_db
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
OPENWEATHER_API_KEY=your-api-key
GROQ_API_KEY=your-api-key
ALLOWED_ORIGINS=http://localhost:5173
```

## API Keys Setup

### OpenWeatherMap API
1. Sign up at https://openweathermap.org/
2. Generate an API key
3. Add to `.env` file

### Groq API
1. Sign up at https://groq.com/
2. Generate an API key
3. Add to `.env` file

## Development

### Backend Development
```powershell
# Run with auto-reload
uvicorn app.main:app --reload

# Run tests (if implemented)
pytest

# Format code
black app/
```

### Frontend Development
```powershell
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check connection string in `.env`
- For MongoDB Atlas, whitelist your IP address

### CORS Issues
- Ensure frontend URL is in `ALLOWED_ORIGINS` in backend `.env`
- Check that frontend is making requests to correct backend URL

### API Key Issues
- Verify API keys are correct in `.env`
- Check API quota/limits haven't been exceeded

## Future Enhancements

- [ ] Real-time price alerts
- [ ] Mobile app (React Native)
- [ ] Export data to CSV/Excel
- [ ] Multi-language support
- [ ] SMS notifications for price changes
- [ ] Crop recommendation system
- [ ] Marketplace integration
- [ ] Advanced analytics dashboard

## License

MIT License

## Contributors

Built for the Web Hackathon

## Support

For issues and questions, please open an issue on GitHub or contact the development team.
