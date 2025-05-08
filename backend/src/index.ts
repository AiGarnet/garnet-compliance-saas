import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Welcome to the backend API' });
});

app.get('/api/status', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Ping route
app.get('/ping', (req: Request, res: Response) => {
  res.send('pong');
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});