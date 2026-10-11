import express from "express";
import financeChatRouter from "./routers/FinanceChat.js";
import authRouter from "./routers/Auth.js";
import userRouter from "./routers/User.js";
import bankRouter from "./routers/Bank.js";
import agentRouter from "./routers/Agent.js";
import webhooksRouter from "./routers/Webhooks.js";
import { startListening } from "./services/photon.js";
import offersRouter from "./routers/Offers.js";
import insightsRouter from "./routers/Insights.js";

const port = process.env.PORT || 3000;

const app = express();

app.use(express.json());
app.use(insightsRouter);
app.use("/auth", authRouter);
app.use("/me", userRouter);
app.use("/agent", agentRouter);
app.use("/webhooks", webhooksRouter);
app.use("/offers", offersRouter);
app.use(bankRouter);
app.use(financeChatRouter);


// Errors thrown in any route end up here (Express 5 forwards rejected async handlers)
app.use((err, req, res, next) => {
  const status = err.status || 500;

  if (status >= 500) {
    console.error(err);

    return res.status(status).json({ error: "Internal server error" });
  }

  res.status(status).json({ error: err.message, fields: err.fields });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

startListening().catch((err) => {
  console.error("Photon listener stopped:", err);
});
