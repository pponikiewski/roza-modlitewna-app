import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';

dotenv.config(); // Ładuje zmienne z pliku .env

const app: Express = express();
const port = process.env.PORT || 3001; // Użyjemy portu 3001 dla backendu

app.get('/', (req: Request, res: Response) => {
  res.send('Witaj na serwerze Róży Modlitewnej!');
});

app.listen(port, () => {
  console.log(`⚡️[server]: Serwer uruchomiony na http://localhost:${port}`);
});