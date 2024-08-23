import path from "path";
import express from "express";
import braintree from "braintree";
import fetch from "node-fetch";

const app = express();
app.use(express.json());
app.use(express.static("client"));

function gatewayTransactionSale(nonceFromTheClient) {
  const newTransaction = gateway.transaction.sale(
    {
      amount: "10.00",
      paymentMethodNonce: nonceFromTheClient,
      options: {
        // This option requests the funds from the transaction
        // once it has been authorized successfully
        submitForSettlement: true,
      },
    },
    (error, result) => {
      if (result) {
        res.json({ success: "true" });
      } else {
        res.status(500).send(error);
      }
    }
  );
}

const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  // Use your own credentials from the sandbox Control Panel > Business > MAID
  merchantId: "964qjhtpsvxdxhrk",
  publicKey: "5zvwn2rwq6mr6sbr",
  privateKey: "a919d96571f3798ca7b374e699f85147",
});

// respond with "hello world" when a GET request is made to the homepage
app.get("/", (req, res) => {
  res.sendFile(path.resolve("./client/index.html"));
});

app.post("/gp-checkout", (req, res) => {
  gatewayTransactionSale(req.body.nonce);
});

app.post("/pp-checkout", (req, res) => {
  const nonceFromTheClient = req.body.nonce;

  const newTransaction = gateway.transaction.sale(
    {
      amount: "10.00",
      paymentMethodNonce: nonceFromTheClient,
      options: {
        // This option requests the funds from the transaction
        // once it has been authorized successfully
        submitForSettlement: true,
      },
    },
    (error, result) => {
      if (result) {
        res.json({ success: "true" });
      } else {
        res.status(500).send(error);
      }
    }
  );
});

app.post("/venmo-checkout", (req, res) => {
  console.log(JSON.stringify("req.body --", req.body));
  const nonceFromTheClient = req.body.nonce;
  console.log(req.body.gateway, "'s Nonce = ", nonceFromTheClient);
  // Create a new transaction for $13
  const newTransaction = gateway.transaction.sale(
    {
      amount: "13.00",
      paymentMethodNonce: nonceFromTheClient,
      options: {
        // This option requests the funds from the transaction
        // once it has been authorized successfully
        submitForSettlement: true,
      },
    },
    (error, result) => {
      if (result) {
        res.json({ success: "true" });
      } else {
        res.status(500).send(error);
      }
    }
  );
});

app.post("/checkout", (req, res) => {
  console.log(JSON.stringify("req.body --", req.body));
  const nonceFromTheClient = req.body.nonce;
  console.log(req.body.gateway, "'s Nonce = ", nonceFromTheClient);
  // Create a new transaction for $10
  const newTransaction = gateway.transaction.sale(
    {
      amount: "10.00",
      paymentMethodNonce: nonceFromTheClient,
      options: {
        // This option requests the funds from the transaction
        // once it has been authorized successfully
        submitForSettlement: true,
      },
    },
    (error, result) => {
      if (result) {
        res.json({ success: "true" });
      } else {
        res.status(500).send(error);
      }
    }
  );
});

app.listen(3000, () => {
  console.log(`Node server listening at http://localhost:3000/`);
});
