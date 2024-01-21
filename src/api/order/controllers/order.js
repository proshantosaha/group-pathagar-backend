// "use strict";
// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// const { createCoreController } = require("@strapi/strapi").factories;

// module.exports = createCoreController("api::order.order", ({ strapi }) => ({
//   async create(ctx) {
//     const { cart } = ctx.request.body;
//     if (!cart) {
//       ctx.response.status = 400;
//       return { error: "cart not found in request body" };
//     }
//     const lineItems = await Promise.all(
//       cart.map(async (product) => {
//         const item = await strapi
//           .service("api::product.product")
//           .findOne(product.id);
//         return {
//           price_data: {
//             currency: "usd",
//             product_data: {
//               name: item.title,
//             },
//             unit_amount: item.price * 100,
//           },
//           quantity: product.amount,
//         };
//       })
//     );
//     try {
//       const session = await stripe.checkout.sessions.create({
//         mode: "payment",
//         success_url: `${process.env.CLIENT_URL}?success=true`,
//         cancel_url: `${process.env.CLIENT_URL}?success=false`,
//         line_items: lineItems,
//         shipping_method_types: { allowed_countries: ["US", "CA"] },
//         payment_method_types: ["card"],
//       });
//       await strapi.service("api::order.order").create({
//         date: {
//           products: cart,
//           stripeId: session.id,
//         },
//       });
//     } catch (error) {
//       ctx.response.status = 500;
//     }
//   },
// }));

("use strict");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
/**
 * order controller
 */

const { createCoreController } = require("@strapi/strapi").factories;

module.exports = createCoreController("api::order.order", ({ strapi }) => ({
  async create(ctx) {
    const { products } = ctx.request.body;
    try {
      const lineItems = await Promise.all(
        products.map(async (product) => {
          const item = await strapi
            .service("api::product.product")
            .findOne(product.id);

          console.log("this is item------->", item);
          console.log("this is product------->", product);

          return {
            price_data: {
              currency: "inr",
              product_data: {
                name: item.name,
              },
              unit_amount: Math.round(item.price * 100),
            },
            quantity: product.quantity,
          };
        })
      );

      const session = await stripe.checkout.sessions.create({
        shipping_address_collection: { allowed_countries: ["BAN"] },
        payment_method_types: ["card"],
        mode: "payment",
        success_url: process.env.CLIENT_URL + `/success`,
        cancel_url: process.env.CLIENT_URL + "/failed",
        line_items: lineItems,
      });

      await strapi
        .service("api::order.order")
        .create({ data: { products, stripeId: session.id } });

      return { stripeSession: session };
    } catch (error) {
      ctx.response.status = 500;
      return { error };
    }
  },
}));
