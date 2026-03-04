import * as React from "react";
import { OrderConfirmationEmail } from "../src/services/email-template.js";

// Sample data for preview
export default function Preview() {
  return (
    <OrderConfirmationEmail
      id="cm9xkp2ab0001ny0p1234abcd"
      total={{ valueOf: () => 149900, toString: () => "149900" } as any}
      shippingCost={{ valueOf: () => 9900, toString: () => "9900" } as any}
      recipientName="María García"
      items={[
        {
          productName: "Anillo Eternidad Oro 18k",
          quantity: 1,
          productPrice: { valueOf: () => 89900, toString: () => "89900" } as any,
          imageUrl:
            "https://res.cloudinary.com/dzqns7kss/image/upload/v1772665459/adamantio-logo-1024x299_ol5fgy.png"
        },
        {
          productName: "Pulsera Eslabones Plata 925",
          quantity: 2,
          productPrice: { valueOf: () => 30050, toString: () => "30050" } as any,
          imageUrl: null
        }
      ]}
      address={{
        fullName: "María García",
        street: "Av. Javier Prado Este 4200",
        district: "Surco",
        city: "Lima",
        state: "Lima",
        postalCode: "15023",
        country: "Perú"
      }}
    />
  );
}
