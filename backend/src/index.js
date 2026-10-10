import express from 'express';

import authRouter from './routers/Auth.js';
import userRouter from './routers/User.js';
import bankRouter from './routers/Bank.js';
import agentRouter from './routers/Agent.js';
import webhooksRouter from './routers/Webhooks.js';

const port = process.env.PORT || 3000;

const app = express();

app.use(express.json());

app.use('/auth', authRouter);
app.use('/me', userRouter);
app.use('/agent', agentRouter);
app.use('/webhooks', webhooksRouter);
// Bank routes span /plaid, /accounts and /transactions, so they carry full paths.
app.use(bankRouter);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
