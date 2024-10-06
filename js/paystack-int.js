function payWithPaystack(amount, email, userId, cartItems) {
  const orderDetails =cartItems;

  createOrder(userId, amount, new Date().toISOString(), orderDetails)
    .then((orderData) => {
      const orderId = orderData.id;

      let handler = PaystackPop.setup({
        
        email: email,
        amount: amount * 100,
        currency: "NGN",
        ref: orderId,
        callback: function (response) {
          console.log(response);
          if (response.status === "success") {
            fetch("https://grublanerestaurant.com/api/payments/createPayments", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                order_id: orderId,
                amount: amount,
                payment_date: new Date().toISOString(),
                payment_method: "Paystack",
                status: "Success",
                paystack_refnumber: response.reference,
              }),
            })
              .then((response) => response.json())
              .then((data) => {
                alert("Payment successful!");
              })
              .catch((error) => {
                alert(
                  "There was an error processing your payment. Please contact support."
                );
              });
          }
        },
        onClose: function () {
          alert("Transaction was not completed, window closed.");
        },
      });
      handler.openIframe();
    })
    .catch((error) => {
      alert("There was an error creating your order. Please try again.");
    });
}

function createOrder(userId, amountPaid, date, orderDetails = "") {
  const endpointUrl = `https://grublanerestaurant.com/api/orders`;
  const orderData = {
    user_id: userId,
    amount_paid: amountPaid,
    date: date,
    order_details: orderDetails,
  };

  return fetch(endpointUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(orderData),
  })
    .then((response) => {
      if (response.status === 201) {
        return response.json();
      } else if (response.status === 409) {
        throw new Error("Order already exists.");
      } else {
        throw new Error("Failed to create order.");
      }
    });
}
