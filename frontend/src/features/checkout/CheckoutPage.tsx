import { Link } from "react-router-dom";
import { useState } from "react";
import { api } from "../../app/api";
import { useCartStore } from "../cart/cart.store";
import ubigeoData from "./peru-ubigeo.json";

type OrderResponse = {
  orderId: string;
  payment: {
    initPoint: string;
    sandboxInitPoint: string;
  };
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

export function CheckoutPage() {
  const { items } = useCartStore();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [district, setDistrict] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [documentType, setDocumentType] = useState<"dni" | "cde">("dni");
  const [documentNumber, setDocumentNumber] = useState("");
  const [phone, setPhone] = useState("");

  const [address, setAddress] = useState({
    fullName: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "Peru"
  });
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const hasFreeShipping = subtotal >= 299;

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
  const validCountry = address.country.trim().length >= 2;

  const canSubmit =
    validEmail &&
    validFirstName &&
    validLastName &&
    validDocument &&
    validPhone &&
    validStreet &&
    validLocation &&
    validCountry;

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
    setDistrict("");
  }

  function handleProvinceChange(value: string) {
    setAddress((prev) => ({
      ...prev,
      city: value,
      postalCode: ""
    }));
    setDistrict("");
  }

  function handleDistrictChange(value: string) {
    const [districtName, postalCode] = value.split("___");
    setDistrict(districtName || "");
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
        }))
      };

      const res = await api<OrderResponse>("/orders", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      const checkoutUrl = res.payment.initPoint || res.payment.sandboxInitPoint;
      if (!checkoutUrl) {
        throw new Error("Mercado Pago did not return a checkout URL");
      }
      localStorage.setItem("checkout_last_order_id", res.orderId);
      if (email.trim()) {
        localStorage.setItem("checkout_guest_email", email.trim());
      }
      window.location.href = checkoutUrl;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
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
              <div className="checkout-shipping-banner">
                <span aria-hidden="true">🚚</span>
                <p>
                  {hasFreeShipping
                    ? "Felicidades, ya tienes envio gratis."
                    : "Te faltan compras para obtener envio gratis."}
                </p>
              </div>

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
                    <select value={district} onChange={(e) => handleDistrictChange(e.target.value)} disabled={!address.city}>
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
                  <label className="checkout-field">
                    <span>Pais</span>
                    <input
                      value={address.country}
                      onChange={(e) => updateAddressField("country", e.target.value)}
                      placeholder="Peru"
                    />
                  </label>
                </div>
              </div>

              <div className="card checkout-block">
                <h2>Pago</h2>
                <p className="checkout-payment-copy">
                  Seras redirigido a Mercado Pago para completar el pago de forma segura.
                </p>
                <div className="checkout-payment-tags">
                  <span>Tarjetas</span>
                  <span>Yape</span>
                  <span>Efectivo</span>
                </div>
              </div>

              {error ? <p className="checkout-error">{error}</p> : null}
              {!canSubmit && !error && items.length > 0 && (
                <p className="checkout-hint">Completa todos los campos obligatorios para continuar.</p>
              )}

              <div className="checkout-actions">
                <Link to="/cart" className="checkout-secondary-link">
                  Volver a carrito
                </Link>
                <button
                  disabled={loading || items.length === 0 || !canSubmit}
                  onClick={submitOrder}
                  className="checkout-primary-btn"
                >
                  {loading ? "Creando orden..." : "Continuar a pago"}
                </button>
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
          <div className="checkout-summary-total">
            <div>
              <span>Subtotal</span>
              <strong>S/ {subtotal.toFixed(2)}</strong>
            </div>
            <div>
              <span>Entrega</span>
              <strong>{hasFreeShipping ? "Gratis" : "Por calcular"}</strong>
            </div>
            <div className="checkout-summary-total-row">
              <span>Total</span>
              <strong>S/ {subtotal.toFixed(2)}</strong>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
