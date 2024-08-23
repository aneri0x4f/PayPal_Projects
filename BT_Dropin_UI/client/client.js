var button = document.querySelector("#submit-button");

braintree.dropin.create(
  {
    authorization: "sandbox_mfrh6kgd_964qjhtpsvxdxhrk",
    selector: "#dropin-container",

    vaultManager: true,
    card: {
      cardholderName: {
        required: true,
      },
    },
    translations: {
      payingWith: "Paying with {{paymentSource}}",
      chooseAnotherWayToPay: "Add yet another way to pay!",
    },
    paypalCredit: {
      flow: "checkout",
      amount: "10.00",
      currency: "USD",
    },
    paypal: {
      flow: "checkout",
      amount: "10.00",
      currency: "USD",
    },
    venmo: {
      allowNewBrowserTab: false,
    },
    googlePay: {
      googlePayVersion: 2,
      merchantId: "merchant-id-from-google",
      transactionInfo: {
        totalPriceStatus: "FINAL",
        totalPrice: "123.45",
        currencyCode: "USD",
      },
      allowedPaymentMethods: [
        {
          type: "CARD",
          parameters: {
            // We recommend collecting and passing billing address information with all Google Pay transactions as a best practice.
            billingAddressRequired: true,
            billingAddressParameters: {
              format: "FULL",
            },
          },
        },
      ],
    },
  },
  function (createErr, instance) {
    if (createErr) {
      $("#responsePayload").html(JSON.stringify(createErr, null, 1));
    }

    button.addEventListener("click", function () {
      instance.requestPaymentMethod(function (
        requestPaymentMethodErr,
        payload
      ) {
        if (requestPaymentMethodErr) {
          $("#responsePayload").html(
            "ERROR" + JSON.stringify(requestPaymentMethodErr, null, 1)
          );
        }

        $("#responsePayload").html("Error" + JSON.stringify(payload, null, 1));
      });
    });

    dropinInstance.on("paymentMethodRequestable", function (event) {
      console.log(event.type); // The type of Payment Method, e.g 'CreditCard', 'PayPalAccount'.
      console.log(event.paymentMethodIsSelected); // True if a customer has selected a payment method when paymentMethodRequestable fires.

      submitButton.removeAttribute("disabled");
    });
  }
);
