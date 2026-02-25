import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { api } from "../../app/api";
import { useCartStore } from "../cart/cart.store";
import ubigeoData from "./peru-ubigeo.json";

const MP_PUBLIC_KEY = import.meta.env.VITE_MP_PUBLIC_KEY as string;

type OrderResponse = {
  orderId: string;
  total: number;
  payment: {
    preferenceId: string;
    initPoint: string;
    sandboxInitPoint: string;
  };
};

type PaymentProcessResponse = {
  status: string;
  status_detail: string;
  payment_id: number;
};

type DistrictOption = { name: string; postalCode: string };
type UbigeoJson = {
  departments: string[];
  provincesByDepartment: Record<string, string[]>;
  districtsByDepartmentProvince: Record<string, Record<string, DistrictOption[]>>;
};

const UBIGEO = ubigeoData as UbigeoJson;
const DEPARTMENTS = UBIGEO.departments;
const PROVINCES_BY_DEPARTMENT = UBIGEO.provincesByDepartment;
const DISTRICTS_BY_DEPARTMENT_PROVINCE = UBIGEO.districtsByDepartmentProvince;

const SHALOM_PRICE = 8;
const OLVA_PRICE_BY_DEPARTMENT: Record<string, number> = {
  Amazonas: 18,
  Ancash: 18,
  Apurimac: 15,
  Ayacucho: 15,
  Cajamarca: 16,
  Cusco: 15,
  Huancavelica: 16,
  Huanuco: 18,
  Ica: 15,
  Junin: 16,
  "La Libertad": 16,
  Lambayeque: 18,
  Lima: 15,
  Loreto: 20,
  "Madre de Dios": 16,
  Moquegua: 12,
  Pasco: 16,
  Piura: 18,
  Puno: 12,
  "San Martin": 18,
  Tacna: 12,
  Tumbes: 20,
  Ucayali: 16,
  Arequipa: 15,
  Callao: 15
};

export function CheckoutPage() {
  const { items } = useCartStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [districtSelectValue, setDistrictSelectValue] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [documentType, setDocumentType] = useState<"dni" | "cde">("dni");
  const [documentNumber, setDocumentNumber] = useState("");
  const [phone, setPhone] = useState("");

  const [orderCreated, setOrderCreated] = useState<{
    orderId: string;
    preferenceId: string;
    amount: number;
  } | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const mpInitialized = useRef(false);
  useEffect(() => {
    if (MP_PUBLIC_KEY && !mpInitialized.current) {
      initMercadoPago(MP_PUBLIC_KEY, { locale: "es-PE" });
      mpInitialized.current = true;
    }
  }, []);

  const [address, setAddress] = useState({
    fullName: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Peru"
  });
  const [courier, setCourier] = useState<"shalom" | "olva">("shalom");
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shippingCost =
    courier === "shalom" ? SHALOM_PRICE : OLVA_PRICE_BY_DEPARTMENT[address.state] ?? 15;
  const beforeCommission = subtotal + shippingCost;
  const mpCommission = 0.0329 * beforeCommission + 0.0329 * beforeCommission * 0.18 + 1.18;
  const total = beforeCommission + mpCommission;

  const emailTrim = email.trim();
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim);
  const validFirstName = firstName.trim().length >= 3 && firstName.trim().length <= 20;
  const validLastName = lastName.trim().length >= 3 && lastName.trim().length <= 20;
  const validDocument =
    documentType === "dni"
      ? /^\d{8}$/.test(documentNumber.trim())
      : documentNumber.trim().length >= 5 && documentNumber.trim().length <= 12 && /^[a-zA-Z0-9]+$/.test(documentNumber.trim());
  const validPhone = phone.trim().length >= 5;
  const validStreet = address.street.trim().length >= 3;
  const validLocation = Boolean(address.state && address.city && address.postalCode);

  const canSubmit =
    validEmail &&
    validFirstName &&
    validLastName &&
    validDocument &&
    validPhone &&
    validStreet &&
    validLocation;

  function updateAddressField(field: keyof typeof address, value: string) {
    setAddress((prev) => ({ ...prev, [field]: value }));
  }

  const provinceOptions = PROVINCES_BY_DEPARTMENT[address.state] ?? [];
  const districtOptions = DISTRICTS_BY_DEPARTMENT_PROVINCE[address.state]?.[address.city] ?? [];

  function handleDepartmentChange(value: string) {
    setAddress((prev) => ({
      ...prev,
      state: value,
      city: "",
      postalCode: ""
    }));
    setDistrictSelectValue("");
  }

  function handleProvinceChange(value: string) {
    setAddress((prev) => ({
      ...prev,
      city: value,
      postalCode: ""
    }));
    setDistrictSelectValue("");
  }

  function handleDistrictChange(value: string) {
    const [, postalCode] = value.split("___");
    setDistrictSelectValue(value);
    setAddress((prev) => ({
      ...prev,
      postalCode: postalCode || ""
    }));
  }

  async function submitOrder() {
    setLoading(true);
    setError("");
    try {
      const normalizedAddress = {
        ...address,
        fullName: `${firstName} ${lastName}`.trim(),
        phone: phone.trim()
      };

      const payload = {
        guestEmail: email || undefined,
        address: normalizedAddress,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        shippingCost,
        mpCommission: Number(mpCommission.toFixed(2))
      };

      const res = await api<OrderResponse>("/orders", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      localStorage.setItem("checkout_last_order_id", res.orderId);
      if (email.trim()) {
        localStorage.setItem("checkout_guest_email", email.trim());
      }

      setOrderCreated({
        orderId: res.orderId,
        preferenceId: res.payment.preferenceId,
        amount: res.total
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePaymentSubmit(param: { formData: Record<string, unknown> }) {
    if (!orderCreated) return;
    setPaymentLoading(true);
    setError("");
    try {
      const res = await api<PaymentProcessResponse>("/payments/process", {
        method: "POST",
        body: JSON.stringify({
          orderId: orderCreated.orderId,
          formData: param.formData
        })
      });

      if (res.status === "approved") {
        navigate(`/checkout/success?external_reference=order_${orderCreated.orderId}`);
      } else if (res.status === "rejected") {
        navigate("/checkout/failure");
      } else {
        navigate("/checkout/pending");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPaymentLoading(false);
    }
  }

  return (
    <section className="checkout-page">
      <div className="checkout-layout">
        <div className="checkout-main">
          {items.length === 0 ? (
            <div className="card checkout-empty">
              <h2>Tu carrito esta vacio</h2>
              <p>Antes de continuar, agrega algunos productos.</p>
              <Link to="/" className="checkout-primary-btn">
                Elegir productos
              </Link>
            </div>
          ) : (
            <>
              <div className="card checkout-block">
                <h2>Identificacion</h2>
                <p className="checkout-note">
                  Solicitamos unicamente la informacion esencial para finalizar la compra.
                </p>
                <div className="checkout-form-grid">
                  <label className="checkout-field checkout-field--full">
                    <span>Correo</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@correo.com"
                      aria-invalid={emailTrim.length > 0 && !validEmail}
                    />
                    {emailTrim.length > 0 && !validEmail && (
                      <span className="checkout-field-error">Ingresa un correo válido.</span>
                    )}
                  </label>
                  <label className="checkout-field">
                    <span>Nombre</span>
                    <input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Nombre"
                      aria-invalid={firstName.trim().length > 0 && !validFirstName}
                    />
                    {firstName.trim().length > 0 && !validFirstName && (
                      <span className="checkout-field-error">Entre 3 y 20 caracteres.</span>
                    )}
                  </label>
                  <label className="checkout-field">
                    <span>Apellidos</span>
                    <input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Apellidos"
                      aria-invalid={lastName.trim().length > 0 && !validLastName}
                    />
                    {lastName.trim().length > 0 && !validLastName && (
                      <span className="checkout-field-error">Entre 3 y 20 caracteres.</span>
                    )}
                  </label>
                  <label className="checkout-field checkout-field--full">
                    <span>Tipo de documento</span>
                    <div className="checkout-doc-types" role="radiogroup" aria-label="Tipo de documento">
                      <label className="checkout-doc-type">
                        <input
                          type="radio"
                          name="checkout-document-type"
                          value="dni"
                          checked={documentType === "dni"}
                          onChange={() => setDocumentType("dni")}
                        />
                        <span>DNI</span>
                      </label>
                      <label className="checkout-doc-type">
                        <input
                          type="radio"
                          name="checkout-document-type"
                          value="cde"
                          checked={documentType === "cde"}
                          onChange={() => setDocumentType("cde")}
                        />
                        <span>Carnet de extranjeria</span>
                      </label>
                    </div>
                  </label>
                  <label className="checkout-field">
                    <span>{documentType === "dni" ? "Documento de identidad" : "Carnet de extranjeria"}</span>
                    <input
                      value={documentNumber}
                      onChange={(e) =>
                        setDocumentNumber(
                          documentType === "dni" ? e.target.value.replace(/\D/g, "").slice(0, 8) : e.target.value
                        )
                      }
                      placeholder={documentType === "dni" ? "Ingrese su DNI" : "Ingrese su carnet"}
                      maxLength={documentType === "dni" ? 8 : 12}
                      aria-invalid={documentNumber.trim().length > 0 && !validDocument}
                    />
                    {documentNumber.trim().length > 0 && !validDocument && (
                      <span className="checkout-field-error">
                        {documentType === "dni"
                          ? "DNI: 8 dígitos numéricos."
                          : "Carnet: entre 5 y 12 caracteres alfanuméricos."}
                      </span>
                    )}
                  </label>
                  <label className="checkout-field">
                    <span>Telefono / Movil</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="999 999 999"
                      aria-invalid={phone.trim().length > 0 && !validPhone}
                    />
                    {phone.trim().length > 0 && !validPhone && (
                      <span className="checkout-field-error">Mínimo 5 caracteres.</span>
                    )}
                  </label>
                </div>
              </div>

              <div className="card checkout-block">
                <h2>Envio</h2>
                <div className="checkout-form-grid">
                  <label className="checkout-field checkout-field--full">
                    <span>Direccion</span>
                    <input
                      value={address.street}
                      onChange={(e) => updateAddressField("street", e.target.value)}
                      placeholder="Calle, numero, referencia"
                      aria-invalid={address.street.trim().length > 0 && !validStreet}
                    />
                    {address.street.trim().length > 0 && !validStreet && (
                      <span className="checkout-field-error">Mínimo 3 caracteres.</span>
                    )}
                  </label>
                  <label className="checkout-field">
                    <span>Departamento</span>
                    <select value={address.state} onChange={(e) => handleDepartmentChange(e.target.value)}>
                      <option value="">Seleccionar departamento</option>
                      {DEPARTMENTS.map((department) => (
                        <option key={department} value={department}>
                          {department}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="checkout-field">
                    <span>Provincia</span>
                    <select
                      value={address.city}
                      onChange={(e) => handleProvinceChange(e.target.value)}
                      disabled={!address.state}
                    >
                      <option value="">Seleccionar provincia</option>
                      {provinceOptions.map((province) => (
                        <option key={province} value={province}>
                          {province}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="checkout-field">
                    <span>Distrito</span>
                    <select value={districtSelectValue} onChange={(e) => handleDistrictChange(e.target.value)} disabled={!address.city}>
                      <option value="">Seleccionar distrito</option>
                      {districtOptions.map((districtOption) => (
                        <option
                          key={`${districtOption.name}-${districtOption.postalCode}`}
                          value={`${districtOption.name}___${districtOption.postalCode}`}
                        >
                          {districtOption.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div className="card checkout-block">
                <h2>Pago</h2>
                {!orderCreated ? (
                  <>
                    <p className="checkout-payment-copy">
                      Completa tus datos y confirma la orden para proceder al pago de forma segura.
                    </p>
                    <div className="checkout-payment-tags">
                      <span>Tarjetas</span>
                      <span>Yape</span>
                      <span>Efectivo</span>
                    </div>
                  </>
                ) : (
                  <>
                    {paymentLoading && <p className="checkout-hint">Procesando pago...</p>}
                    <Payment
                      initialization={{
                        amount: orderCreated.amount,
                        preferenceId: orderCreated.preferenceId
                      }}
                      customization={{
                        paymentMethods: {
                          creditCard: "all",
                          debitCard: "all",
                          mercadoPago: "all"
                        }
                      }}
                      onSubmit={async ({ formData }) => {
                        await handlePaymentSubmit({ formData: formData as unknown as Record<string, unknown> });
                      }}
                      onReady={() => {}}
                      onError={(error) => {
                        // eslint-disable-next-line no-console
                        console.error("Payment Brick error:", error);
                        setError("Error al cargar el formulario de pago.");
                      }}
                    />
                  </>
                )}
              </div>

              {error ? <p className="checkout-error">{error}</p> : null}
              {!orderCreated && !canSubmit && !error && items.length > 0 && (
                <p className="checkout-hint">Completa todos los campos obligatorios para continuar.</p>
              )}

              <div className="checkout-actions">
                <Link to="/cart" className="checkout-secondary-link">
                  Volver a carrito
                </Link>
                {!orderCreated && (
                  <button
                    disabled={loading || items.length === 0 || !canSubmit}
                    onClick={submitOrder}
                    className="checkout-primary-btn"
                  >
                    {loading ? "Creando orden..." : "Confirmar orden"}
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <aside className="card checkout-summary">
          <h3>Resumen de la compra</h3>
          <div className="checkout-summary-list">
            {items.map((item) => (
              <div key={item.productId} className="checkout-summary-item">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="checkout-summary-thumb" />
                ) : (
                  <div className="checkout-summary-thumb checkout-summary-thumb--fallback" aria-hidden="true" />
                )}
                <div className="checkout-summary-item-info">
                  <strong>{item.name}</strong>
                  <span>Cantidad: {item.quantity}</span>
                </div>
                <strong>S/ {(item.price * item.quantity).toFixed(2)}</strong>
              </div>
            ))}
          </div>
          <div className="checkout-summary-shipping" role="radiogroup" aria-label="Empresa de envío">
            <span className="checkout-summary-shipping-label">Envío</span>
            <div className="checkout-courier-options">
              <label className="checkout-courier-option">
                <input
                  type="radio"
                  name="checkout-courier"
                  value="shalom"
                  checked={courier === "shalom"}
                  onChange={() => setCourier("shalom")}
                />
                <span>Shalom — S/ {SHALOM_PRICE.toFixed(2)}</span>
              </label>
              <label className="checkout-courier-option">
                <input
                  type="radio"
                  name="checkout-courier"
                  value="olva"
                  checked={courier === "olva"}
                  onChange={() => setCourier("olva")}
                />
                <span>
                  Olva Courier — {address.state ? `S/ ${(OLVA_PRICE_BY_DEPARTMENT[address.state] ?? 15).toFixed(2)}` : "según departamento"}
                </span>
              </label>
            </div>
          </div>
          <div className="checkout-summary-total">
            <div>
              <span>Subtotal</span>
              <strong>S/ {subtotal.toFixed(2)}</strong>
            </div>
            <div>
              <span>Envío</span>
              <strong>S/ {shippingCost.toFixed(2)}</strong>
            </div>
            <div>
              <span>Comisión Mercado Pago</span>
              <strong>S/ {mpCommission.toFixed(2)}</strong>
            </div>
            <div className="checkout-summary-total-row">
              <span>Total</span>
              <strong>S/ {total.toFixed(2)}</strong>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
