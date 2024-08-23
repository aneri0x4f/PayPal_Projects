var form = document.querySelector("#my-sample-form");
var submit = document.querySelector('input[type="submit"]');
var paypalButton = document.querySelector(".paypal-button");
var venmoButton = document.getElementById("venmo-button");
var button = document.querySelector("#google-pay-button");
var paymentsClient = new google.payments.api.PaymentsClient({
  environment: "TEST", // Or 'PRODUCTION'
});

braintree.client.create(
  {
    authorization: "sandbox_mfrh6kgd_964qjhtpsvxdxhrk",
  },
  function (clientErr, clientInstance) {
    if (clientErr) {
      console.error(clientErr);
      return;
    }

    //Hosted Fields
    braintree.hostedFields.create(
      {
        client: clientInstance,
        styles: {
          input: {
            "font-size": "14px",
          },
          "input.invalid": {
            color: "red",
          },
          "input.valid": {
            color: "green",
          },
        },
        fields: {
          number: {
            container: "#card-number",
            placeholder: "4111 1111 1111 1111",
          },
          cvv: {
            container: "#cvv",
            placeholder: "123",
          },
          expirationDate: {
            container: "#expiration-date",
            placeholder: "10/2022",
          },
        },
      },
      function (hostedFieldsErr, hostedFieldsInstance) {
        if (hostedFieldsErr) {
          console.error(hostedFieldsErr);
          return;
        }

        submit.removeAttribute("disabled");

        form.addEventListener(
          "submit",
          function (event) {
            event.preventDefault();

            hostedFieldsInstance.tokenize(function (tokenizeErr, payload) {
              if (tokenizeErr) {
                console.error(tokenizeErr);
                return;
              }

              // If this was a real integration, this is where you would
              // send the nonce to your server.
              console.log("Got a nonce: " + payload.nonce);

              fetch("/checkout", {
                method: "POST",
                body: JSON.stringify({
                  nonce: payload.nonce,
                  gateway: "Braintree",
                }),
                headers: {
                  "Content-Type": "application/json",
                },
              }).then((res) => {
                window.location.href = "/success.html";
              });
            });
          },
          false
        );
      }
    );

    // Reference
    // https://braintree.github.io/braintree-web/3.92.1/module-braintree-web_apple-pay.html

    braintree.paypalCheckout.create(
      {
        client: clientInstance,
      },
      function (paypalErr, paypalInstance) {
        if (paypalErr) {
          console.error("Error creating PayPal:", paypalErr);
          return;
        }
        paypalInstance.loadPayPalSDK(
          {
            currency: "USD",
            intent: "capture",
          },
          function () {
            paypal
              .Buttons({
                fundingSource: paypal.FUNDING.PAYPAL,

                createOrder: function () {
                  return paypalInstance.createPayment({
                    flow: "checkout", // Required
                    amount: 15.0, // Required
                    currency: "USD", // Required, must match the currency passed in with loadPayPalSDK

                    intent: "capture", // Must match the intent passed in with loadPayPalSDK

                    enableShippingAddress: true,
                    shippingAddressEditable: false,
                    shippingAddressOverride: {
                      recipientName: "Scruff McGruff",
                      line1: "1234 Main St.",
                      line2: "Unit 1",
                      city: "Chicago",
                      countryCode: "US",
                      postalCode: "60652",
                      state: "IL",
                      phone: "123.456.7890",
                    },
                  });
                },
                //  onShippingChange: function (data, actions) {
                //   // Perform some validation or calculation logic on 'data'

                //   if ( /* need to update shipping options or lineItems */ ) {
                //     return paypalInstance.updatePayment({
                //       amount: 15.00,              // Required
                //       currency: 'USD',
                //       lineItems: [...],           // Required
                //       paymentId: data.paymentId,  // Required
                //       // shippingOptions: [...],     // Optional
                //     });
                //   } else if (/* address not supported */) {
                //     return actions.reject();
                //   }

                //   return actions.resolve();
                // }

                onApprove: function (data, actions) {
                  return paypalInstance.tokenizePayment(
                    data,
                    function (err, payload) {
                      console.log(payload);
                      fetch("/pp-checkout", {
                        method: "POST",
                        body: JSON.stringify({
                          nonce: payload.nonce,
                          gateway: "PayPal",
                        }),
                        headers: {
                          "Content-Type": "application/json",
                        },
                      }).then((res) => {
                        if (res.success) window.location.href = "/success.html";
                      });
                    }
                  );
                },

                onCancel: function (data) {
                  console.log(
                    "PayPal payment cancelled",
                    JSON.stringify(data, 0, 2)
                  );
                },

                onError: function (err) {
                  console.error("PayPal error", err);
                },
              })
              .render("#paypal-button")
              .then(function () {
                // The PayPal button will be rendered in an html element with the ID
                // 'paypal-button'. This function will be called when the PayPal button
                // is set up and ready to be used
              });
          }
        );
      }
    );

    // Venmo
    braintree.venmo.create(
      {
        client: clientInstance,
        totalamount: 10.0,
        allowDesktop: true,
        mobileWebFallBack: true,
        allowDesktopWebLogin: true,
        paymentMethodUsage: "single_use",
        profileId: "1953896702662410263",
      },
      function (venmoErr, venmoInstance) {
        // Stop if there was a problem creating Venmo.
        // This could happen if there was a network error or if it's incorrectly
        // configured.
        if (venmoErr) {
          console.error("Error creating Venmo:", venmoErr);
          return;
        }
        if (!venmoInstance.isBrowserSupported()) {
          console.log("Browser does not support Venmo");
          return;
        }

        displayVenmoButton(venmoInstance);

        // Check if tokenization results already exist. This occurs when your
        // checkout page is relaunched in a new tab. This step can be omitted
        // if allowNewBrowserTab is false.
        if (venmoInstance.hasTokenizationResult()) {
          venmoInstance.tokenize(function (tokenizeErr, payload) {
            if (err) {
              handleVenmoError(tokenizeErr);
            } else {
              handleVenmoSuccess(payload);
            }
          });
          return;
        }
      }
    );
    function displayVenmoButton(venmoInstance) {
      // Assumes that venmoButton is initially display: none.
      venmoButton.style.display = "block";

      venmoButton.addEventListener("click", function () {
        venmoButton.disabled = true;

        venmoInstance.tokenize(function (tokenizeErr, payload) {
          venmoButton.removeAttribute("disabled");

          if (tokenizeErr) {
            handleVenmoError(tokenizeErr);
          } else {
            handleVenmoSuccess(payload);
          }
        });
      });
    }

    function handleVenmoSuccess(payload) {
      // Send payload.nonce to your server.
      console.log("Got a payment method nonce:", payload.nonce);
      fetch("/venmo-checkout", {
        method: "POST",
        body: JSON.stringify({
          nonce: payload.nonce,
          gateway: "Braintree",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      }).then((res) => {
        if (res.success) window.location.href = "/success.html";
      });

      // Display the Venmo username in your checkout UI.
      console.log("Venmo user:", payload.details.username);
    }

    braintree.googlePayment.create(
      {
        client: clientInstance,
        googlePayVersion: 2,
        googleMerchantId: "merchant-id-from-google", // Optional in sandbox; if set in sandbox, this value must be a valid production Google Merchant ID
      },
      function (googlePaymentErr, googlePaymentInstance) {
        paymentsClient
          .isReadyToPay({
            // see https://developers.google.com/pay/api/web/reference/object#IsReadyToPayRequest
            apiVersion: 2,
            apiVersionMinor: 0,
            allowedPaymentMethods:
              googlePaymentInstance.createPaymentDataRequest()
                .allowedPaymentMethods,
            existingPaymentMethodRequired: true, // Optional
          })
          .then(function (response) {
            if (response.result) {
              button.addEventListener("click", function (event) {
                event.preventDefault();

                var paymentDataRequest =
                  googlePaymentInstance.createPaymentDataRequest({
                    transactionInfo: {
                      currencyCode: "USD",
                      totalPriceStatus: "FINAL",
                      totalPrice: "44.00", // Your amount
                    },
                  });

                // We recommend collecting billing address information, at minimum
                // billing postal code, and passing that billing postal code with all
                // Google Pay card transactions as a best practice.
                // See all available options at https://developers.google.com/pay/api/web/reference/object
                var cardPaymentMethod =
                  paymentDataRequest.allowedPaymentMethods[0];
                cardPaymentMethod.parameters.billingAddressRequired = true;
                cardPaymentMethod.parameters.billingAddressParameters = {
                  format: "FULL",
                  phoneNumberRequired: true,
                };

                paymentsClient
                  .loadPaymentData(paymentDataRequest)
                  .then(function (paymentData) {
                    googlePaymentInstance.parseResponse(
                      paymentData,
                      function (err, result) {
                        if (err) {
                          // Handle parsing error
                        }
                        console.log("payment dataa", paymentData);
                        fetch("/gp-checkout", {
                          method: "POST",
                          body: JSON.stringify({
                            nonce: payload.nonce,
                            gateway: "GooglePay",
                          }),
                          headers: {
                            "Content-Type": "application/json",
                          },
                        }).then((res) => {
                          if (res.success)
                            window.location.href = "/success.html";
                        });
                        // Send result.nonce to your server
                        // result.type may be either "AndroidPayCard" or "PayPalAccount", and
                        // paymentData will contain the billingAddress for card payments
                      }
                    );
                  })
                  .catch(function (err) {
                    // Handle errors
                  });
              });
            }
          })
          .catch(function (err) {
            // Handle errors
          });
      }
    );

    // Set up other Braintree components
  }
);

// let d = document.querySelector("#card-number");
// d.value = "4111 1111 1111 1111";
