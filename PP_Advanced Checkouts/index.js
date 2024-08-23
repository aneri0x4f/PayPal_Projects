import express from "express";
import fetch from "node-fetch";
import "dotenv/config";
const app = express();
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const port = process.env.PORT || 3000;
const environment = process.env.ENVIRONMENT || "sandbox";
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const endpoint_url =
  environment === "sandbox"
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

app.post("/create_order", (req, res) => {
  get_access_token()
    .then((access_token) => {
      let order_data_json = {
        intent: req.body.intent.toUpperCase(),
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: "20.00",
            },
          },
        ],
      };
      const data = JSON.stringify(order_data_json);

      fetch(endpoint_url + "/v2/checkout/orders", {
        //https://developer.paypal.com/docs/api/orders/v2/#orders_create
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
        body: data,
      })
        .then((res) => res.json())
        .then((json) => {
          res.send(json);
        }); //Send minimal data to client
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send(err);
    });
});

app.post("/complete_order", (req, res) => {
  get_access_token()
    .then((access_token) => {
      fetch(
        endpoint_url +
          "/v2/checkout/orders/" +
          req.body.order_id +
          "/" +
          req.body.intent,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`,
          },
        }
      )
        .then((res) => res.json())
        .then((json) => {
          console.log(json);
          //add sendgrid logic if oyu want to sned emails
          if (json.id) {
            console.log({ id: json.id, email: req.body.email });
          }
          res.send(json);
        }); //Send minimal data to client
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send(err);
    });
});

app.post("/get_client_token", (req, res) => {
  get_access_token()
    .then((access_token) => {
      const payload = req.body.customer_id
        ? JSON.stringify({ customer_id: req.body.customer_id })
        : null;

      fetch(endpoint_url + "/v1/identity/generate-token", {
        method: "post",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
        body: payload,
      })
        .then((response) => response.json())
        .then((data) => res.send(data.client_token));
    })
    .catch((error) => {
      console.error("Error:", error);
      res.status(500).send("An error occurred while processing the request.");
    });
});

//Servers the index.html file
app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/index.html");
});
//Servers the style.css file
app.get("/style.css", (req, res) => {
  res.sendFile(process.cwd() + "/style.css");
});
//Servers the script.js file
app.get("/script.js", (req, res) => {
  res.sendFile(process.cwd() + "/script.js");
});

function get_access_token() {
  const auth = `${client_id}:${client_secret}`;
  const data = "grant_type=client_credentials";
  return fetch(endpoint_url + "/v1/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(auth).toString("base64")}`,
    },
    body: data,
  })
    .then((res) => res.json())
    .then((json) => {
      return json.access_token;
    });
}

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
