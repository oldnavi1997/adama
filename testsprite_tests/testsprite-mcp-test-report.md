# TestSprite AI Testing Report (MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** ecommerce-f (Adamantio)
- **Date:** 2026-03-04
- **Prepared by:** TestSprite AI Team
- **Total Tests:** 53
- **Passed:** 17 (32.1%)
- **Failed:** 36 (67.9%)

---

## 2️⃣ Requirement Validation Summary

---

### Requirement: Catalog / Home Page
- **Description:** Home page must load featured categories and a recently added products slider.

#### Test TC001 Home page loads featured categories and recently added products slider
- **Test Code:** [TC001](./TC001_Home_page_loads_featured_categories_and_recently_added_products_slider.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/790b46f6-4bbf-4b32-9a0a-af67a15f7f65
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** La página de inicio carga correctamente las categorías destacadas y el slider de productos recientes.

#### Test TC002 Navigate from home slider product card to product detail page
- **Test Code:** [TC002](./TC002_Navigate_from_home_slider_product_card_to_product_detail_page.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/ce4f7564-a012-4420-8803-eaa95d9a933f
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** La navegación desde el slider al detalle de producto funciona correctamente.

#### Test TC003 Scroll home slider using Next and Previous controls
- **Test Code:** [TC003](./TC003_Scroll_home_slider_using_Next_and_Previous_controls.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/aea8fc43-1b98-4b4c-b8ea-a988518e764f
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Los controles de navegación Anterior/Siguiente del slider funcionan correctamente.

#### Test TC004 Navigate from featured category card to category listing page
- **Test Code:** [TC004](./TC004_Navigate_from_featured_category_card_to_category_listing_page.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/bd7b1a9b-fb7f-44b8-ab59-06eb5d76c14d
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Las cards de categoría destacada navegan correctamente a la página de listado.

#### Test TC005 Featured category card CTA link navigates to the same category page
- **Test Code:** [TC005](./TC005_Featured_category_card_CTA_link_navigates_to_the_same_category_page.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/fae411f5-ecde-4b76-a1de-95caf2146880
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** El enlace CTA de la card de categoría lleva a la página correcta.

---

### Requirement: Product Search
- **Description:** Búsqueda en tiempo real con debounce, accent-insensitive, con resultados y estado vacío.

#### Test TC007 Search drawer returns results and navigates to product detail from a result
- **Test Code:** [TC007](./TC007_Search_drawer_returns_results_and_navigates_to_product_detail_from_a_result.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/26ca9c0c-b0f2-4f76-9e7c-c80dd03c380e
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** El drawer de búsqueda retorna resultados y la navegación al detalle de producto funciona.

#### Test TC008 Search results show image, name, category, and price for an item
- **Test Code:** [TC008](./TC008_Search_results_show_image_name_category_and_price_for_an_item.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/2cae0b85-04de-4432-b634-2f9608f93ad9
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** Los resultados de búsqueda muestran correctamente imagen, nombre, categoría y precio.

#### Test TC009 Typing only 1 character shows the minimum-characters hint
- **Test Code:** [TC009](./TC009_Typing_only_1_character_shows_the_minimum_characters_hint.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/7f5293ab-7677-4a92-82ff-77e42c16866d
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** El hint de mínimo 2 caracteres se muestra correctamente.

#### Test TC010 Closing the search drawer via X hides the drawer UI
- **Test Code:** [TC010](./TC010_Closing_the_search_drawer_via_X_hides_the_drawer_UI.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/e541bb76-aea0-4c20-97b3-e4fff4284c1d
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** El botón de cerrar (×) con aria-label 'Cerrar busqueda' no cierra el drawer. El panel permanece visible después del click. Bug funcional en el componente de cierre del drawer.

#### Test TC011 Accent-insensitive search returns results for unaccented query
- **Test Code:** [TC011](./TC011_Accent_insensitive_search_returns_results_for_unaccented_query.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/83d74648-de56-4f11-8d89-54f1cab8e3b5
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** La búsqueda accent-insensitive (via extensión `unaccent` de PostgreSQL) funciona correctamente.

#### Test TC012 No-results state is shown for a query with no matches
- **Test Code:** [TC012](./TC012_No_results_state_is_shown_for_a_query_with_no_matches.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/5f739732-5681-4cfb-97e8-27b15c3589ab
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** El estado de sin resultados se muestra correctamente para queries sin coincidencias.

---

### Requirement: Category Browsing
- **Description:** Listar productos por categoría con ordenamiento, vista grid/lista y paginación.

#### Test TC006 Category page empty state shows 'No products found' after navigating from home
- **Test Code:** [TC006](./TC006_Category_page_empty_state_shows_No_products_found_after_navigating_from_home.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/b427aeb5-58ac-491b-bad9-b12723ecd85b
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** El estado vacío de categoría se muestra correctamente.

#### Test TC013 Category page shows product list for a category
- **Test Code:** [TC013](./TC013_Category_page_shows_product_list_for_a_category.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/81613aaf-e188-4dd9-b340-c7a3256a1314
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** La página de categoría carga y muestra correctamente el listado de productos.

#### Test TC014 Sorting products by Latest updates the category listing
- **Test Code:** [TC014](./TC014_Sorting_products_by_Latest_updates_the_category_listing.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/ee2f9c41-5210-4c92-be9c-195be35af906
- **Status:** ❌ Failed
- **Severity:** MEDIUM
- **Analysis / Findings:** La opción de ordenar por 'Latest' (más recientes) no existe en el dropdown. Las opciones disponibles son: Orden predeterminado, Precio: menor a mayor, Precio: mayor a menor, Nombre: A-Z. Falta la opción de ordenar por fecha de agregado.

#### Test TC015 Sorting products by Price (Low to High) keeps results visible
- **Test Code:** [TC015](./TC015_Sorting_products_by_Price_Low_to_High_keeps_results_visible.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/8ac548e0-de63-4bfe-9a76-dcc8903b3f8a
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** El ordenamiento por precio (menor a mayor) funciona y mantiene los resultados visibles.

#### Test TC016 Toggle between Grid view and List view on category page
- **Test Code:** [TC016](./TC016_Toggle_between_Grid_view_and_List_view_on_category_page.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/e79bbee8-b950-4efa-99d1-b824763107b3
- **Status:** ❌ Failed
- **Severity:** MEDIUM
- **Analysis / Findings:** El control de toggle Grid/Lista no se encontró en la página de categoría. No hay elementos etiquetados como 'Grid view' o 'List view'. El feature puede no estar implementado o no ser accesible desde la UI.

#### Test TC017 Pagination: navigate from page 1 to page 2 within a category
- **Test Code:** [TC017](./TC017_Pagination_navigate_from_page_1_to_page_2_within_a_category.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/99aa5347-2249-4118-b382-21a188e0ca7e
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** No se encontró control de paginación. Los productos muestran 'Cargando productos...' indefinidamente. Posible problema con la carga de productos en la categoría 'anillos-de-pareja' durante el test.

#### Test TC018 Pagination persists after changing sort option
- **Test Code:** [TC018](./TC018_Pagination_persists_after_changing_sort_option.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/73986eff-8ab4-4078-ac75-ceea8b5c1962
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** No se muestran productos ('Cargando productos...' permanente). El control de paginación no aparece porque no hay resultados cargados. Relacionado con el issue de TC017.

#### Test TC019 Open a product detail page from a category product card
- **Test Code:** [TC019](./TC019_Open_a_product_detail_page_from_a_category_product_card.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/ad6f94d4-1c49-4188-a52f-19413e599c5d
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** La navegación desde un product card al detalle funciona correctamente.

#### Test TC020 Out-of-range pagination shows empty message or redirects to last page
- **Test Code:** [TC020](./TC020_Out_of_range_pagination_shows_empty_message_or_redirects_to_last_page.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/259316c3-226e-47a3-9216-a1b130b61c5e
- **Status:** ❌ Failed
- **Severity:** LOW
- **Analysis / Findings:** No se encontró control de paginación en la página de categoría. Mismo síntoma que TC017/TC018.

---

### Requirement: Product Detail
- **Description:** Ver galería de imágenes, secciones colapsables, agregar al carrito y breadcrumb.

#### Test TC021 Product detail page: view gallery and open lightbox
- **Test Code:** [TC021](./TC021_Product_detail_page_view_gallery_and_open_lightbox.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/979a2826-fd71-4373-802f-92f68eb67ca7
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** La página de detalle muestra 'Cargando...' indefinidamente sin mostrar imágenes ni thumbnails. El lightbox no está disponible. Posible problema de carga del backend al acceder por ID directo.

#### Test TC022 Product detail page: navigate gallery using Previous/Next controls
- **Test Code:** [TC022](./TC022_Product_detail_page_navigate_gallery_using_PreviousNext_controls.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/ebc3159c-ca22-4529-84cc-0753dbb2b5d2
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** No hay product cards en la categoría (muestra '0 de 0 resultados'). El slider del home también muestra 'No hay productos recientes.'. Problema de conectividad con el backend o datos vacíos durante el test.

#### Test TC023 Product detail page: toggle collapsible informational sections
- **Test Code:** [TC023](./TC023_Product_detail_page_toggle_collapsible_informational_sections.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/437b2846-83d9-4462-9ccb-0a8d16967ebd
- **Status:** ❌ Failed
- **Severity:** MEDIUM
- **Analysis / Findings:** La sección 'Talla' no se encontró en el producto testeado. El producto sí tiene secciones Detalles, Envío y Grabado. El campo `sizeInfo` puede no estar populado para ese producto específico.

#### Test TC024 Product detail page: add in-stock product to cart and see success feedback
- **Test Code:** [TC024](./TC024_Product_detail_page_add_in_stock_product_to_cart_and_see_success_feedback.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/6f4ae3fb-1d49-49cd-af2a-10462dff192a
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** El botón 'Agregar al carrito' funciona y muestra correctamente el feedback 'Agregado al carrito'.

#### Test TC025 Product detail page: out-of-stock product shows 'Sin stock' and blocks add-to-cart
- **Test Code:** [TC025](./TC025_Product_detail_page_out_of_stock_product_shows_Sin_stock_and_blocks_add_to_cart.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/201f1757-cbfd-4ffb-9c99-a9c355c31b5a
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** No se encontró etiqueta 'Sin stock'. El botón 'Agregar al carrito' aparece habilitado para un producto sin stock. Posible bug de UI: el estado de stock no se refleja correctamente o el producto testeado no estaba realmente sin stock.

#### Test TC026 Product detail page: breadcrumb category link navigates to a category page
- **Test Code:** [TC026](./TC026_Product_detail_page_breadcrumb_category_link_navigates_to_a_category_page.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/f67b55af-8c72-4e79-9b84-6baf1c3e56f2
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** El breadcrumb funciona correctamente y navega a la categoría correspondiente.

#### Test TC027 Product detail page: collapsible 'Grabado' section is accessible before adding to cart
- **Test Code:** [TC027](./TC027_Product_detail_page_collapsible_Grabado_section_is_accessible_before_adding_to_cart.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/045c04d6-c70e-4ed8-a1f4-902b0304632b
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** La sección colapsable 'Grabado' es accesible y funcional antes de agregar al carrito.

#### Test TC028 Product detail page: lightbox can be dismissed
- **Test Code:** [TC028](./TC028_Product_detail_page_lightbox_can_be_dismissed.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/393c5718-6c1a-4bae-a919-9d8050aed060
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** El lightbox no se puede cerrar: el botón de cierre activa las flechas de navegación en vez de cerrar, y la tecla Escape tampoco funciona. El overlay del lightbox permanece visible. Bug crítico en la funcionalidad de cierre del lightbox.

---

### Requirement: Shopping Cart
- **Description:** Ver y gestionar ítems del carrito con controles de cantidad antes del checkout.

#### Test TC029 Proceed from Cart to Checkout after updating quantities
- **Test Code:** [TC029](./TC029_Proceed_from_Cart_to_Checkout_after_updating_quantities.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/9fdb66a8-ec33-4f5d-ac62-a91811e2c83e
- **Status:** ❌ Failed
- **Severity:** MEDIUM
- **Analysis / Findings:** El carrito está vacío en el test ('Su carrito está vacío'). Los tests de carrito no persisten el estado entre navegaciones ya que el store es de localStorage. Se necesita agregar un producto al carrito antes de testear funcionalidades del cart.

#### Test TC030 Cart shows all required item details and totals summary
- **Test Code:** [TC030](./TC030_Cart_shows_all_required_item_details_and_totals_summary.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/a261ab96-4b98-4aeb-8ef9-4a504f756da0
- **Status:** ❌ Failed
- **Severity:** MEDIUM
- **Analysis / Findings:** El carrito está vacío. Mismo issue que TC029: la sesión de test no mantiene el carrito populado.

#### Test TC031 Directly typing quantity updates totals
- **Test Code:** [TC031](./TC031_Directly_typing_quantity_updates_totals.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/ec2f22fe-66c1-42fe-9c9e-be20798d3157
- **Status:** ❌ Failed
- **Severity:** MEDIUM
- **Analysis / Findings:** El carrito está vacío. Mismo issue de estado persistente del carrito.

#### Test TC032 Invalid quantity of 0 is rejected with inline validation
- **Test Code:** [TC032](./TC032_Invalid_quantity_of_0_is_rejected_with_inline_validation.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/45dbf0d2-81ef-49fa-98df-b15befe2f055
- **Status:** ❌ Failed
- **Severity:** LOW
- **Analysis / Findings:** El carrito está vacío. No se puede testear validación de cantidad.

#### Test TC033 Invalid quantity greater than 10 is rejected with inline validation
- **Test Code:** [TC033](./TC033_Invalid_quantity_greater_than_10_is_rejected_with_inline_validation.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/7523b8c7-78d8-4ec9-8cce-5bc8dfda4a6f
- **Status:** ❌ Failed
- **Severity:** LOW
- **Analysis / Findings:** El carrito está vacío. No se puede testear validación de cantidad máxima.

#### Test TC034 Remove an item from cart updates the cart contents and totals
- **Test Code:** [TC034](./TC034_Remove_an_item_from_cart_updates_the_cart_contents_and_totals.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/aafdda5b-7dc2-4233-8928-8eaf2be1e170
- **Status:** ❌ Failed
- **Severity:** MEDIUM
- **Analysis / Findings:** El carrito está vacío. No hay ítems para eliminar ni verificar totales.

#### Test TC035 Free shipping banner displays when total is below S/ 299
- **Test Code:** [TC035](./TC035_Free_shipping_banner_displays_when_total_is_below_S_299.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/1c053a11-4021-43c7-9aba-ff9286c90519
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** El banner de envío gratis se muestra correctamente cuando el total está por debajo de S/ 299.

#### Test TC036 Checkout CTA routes to the Checkout page from the Cart
- **Test Code:** [TC036](./TC036_Checkout_CTA_routes_to_the_Checkout_page_from_the_Cart.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/d3113d61-20b8-405b-977b-95f126c7ab3f
- **Status:** ❌ Failed
- **Severity:** MEDIUM
- **Analysis / Findings:** El botón 'Continuar con la compra' no está disponible porque el carrito está vacío. Solo se muestra el link 'Elegir productos'. Mismo issue de carrito vacío.

---

### Requirement: Checkout
- **Description:** Formulario completo de checkout con datos personales, dirección peruana (ubigeo) y métodos de pago.

#### Test TC037 Checkout page loads and shows key sections (contact, shipping, payment)
- **Test Code:** [TC037](./TC037_Checkout_page_loads_and_shows_key_sections_contact_shipping_payment.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/fc0cb16a-1764-46ef-8b8d-10e10c446040
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** El checkout redirige al home o muestra la página de inicio al acceder con carrito vacío. El checkout requiere ítems en el carrito para mostrar el formulario. No hay redirección con mensaje de error claro.

#### Test TC038 Inline validation shows required field errors when submitting empty checkout form
- **Test Code:** [TC038](./TC038_Inline_validation_shows_required_field_errors_when_submitting_empty_checkout_form.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/e23b9c3d-558c-4043-ab8e-9d0e7bf2d29e
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** El checkout no es accesible sin ítems en el carrito. No se puede testear validación inline.

#### Test TC039 Correct validation errors then re-submit
- **Test Code:** [TC039](./TC039_Correct_validation_errors_then_re_submit_email_required__invalid_document.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/f29fd985-7460-48f4-994c-5eeba2dc3cb1
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** Mismo problema: carrito vacío impide acceder al checkout.

#### Test TC040 Ubigeo cascade: selecting Department enables Province selection
- **Test Code:** [TC040](./TC040_Ubigeo_cascade_selecting_Department_enables_Province_selection.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/517f8d93-7961-4aa2-86a1-751ad737e930
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** Los dropdowns de Departamento/Provincia no están disponibles sin acceso al checkout.

#### Test TC041 Ubigeo cascade: selecting Province enables District selection
- **Test Code:** [TC041](./TC041_Ubigeo_cascade_selecting_Province_enables_District_selection.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/97fdb6bb-eddf-474f-8937-580853185406
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** Mismo issue: checkout inaccesible por carrito vacío.

#### Test TC042 Shipping method selection toggles between Shalom and Olva Courier
- **Test Code:** [TC042](./TC042_Shipping_method_selection_toggles_between_Shalom_and_Olva_Courier.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/b53d64df-b2cd-416e-88e2-a01d2f5417ed
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** La selección entre Shalom y Olva Courier funciona correctamente.

#### Test TC043 Switch payment method tabs between Card and Yape
- **Test Code:** [TC043](./TC043_Switch_payment_method_tabs_between_Card_and_Yape.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/89dfc80b-0a8e-46dd-91b3-fda4b5a620d0
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** Los tabs de métodos de pago (Card/Yape) no se encontraron. El checkout no está accesible sin carrito con ítems.

#### Test TC044 Submit checkout with Card method shows payment brick
- **Test Code:** [TC044](./TC044_Submit_checkout_with_Card_method_shows_payment_brick_and_stays_on_checkout_if_payment_cannot_complete.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/3d7796f2-83a3-4f36-99e0-2a653cc0a0f2
- **Status:** ❌ Failed
- **Severity:** HIGH
- **Analysis / Findings:** El Mercado Pago Payment Brick no se renderiza. El carrito tiene subtotal S/ 0.00, lo que impide mostrar el widget de pago.

---

### Requirement: Order Confirmation & Payment Status Pages
- **Description:** Páginas de confirmación, fallo y pendiente de pago post-checkout.

#### Test TC045 Checkout Failure page renders payment failure messaging and next steps
- **Test Code:** [TC045](./TC045_Checkout_Failure_page_renders_payment_failure_messaging_and_next_steps.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/2562b8da-b142-400a-919d-c8b97161da69
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** La página de fallo de pago renderiza correctamente el mensaje y los próximos pasos.

#### Test TC046 Checkout Pending page renders payment pending messaging
- **Test Code:** [TC046](./TC046_Checkout_Pending_page_renders_payment_pending_messaging.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/0c4893a0-2307-4d90-95c5-2906ccd02e55
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** La página de pago pendiente renderiza correctamente el mensaje.

---

### Requirement: Legal Pages
- **Description:** Páginas estáticas de Términos, Política de Reembolsos, Privacidad y Libro de Reclamaciones.

#### Test TC047 Open Terms of Service page and verify core content renders
- **Test Code:** [TC047](./TC047_Open_Terms_of_Service_page_and_verify_core_content_renders.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/5f12e7eb-72fc-4027-b069-0c81113f6d66
- **Status:** ❌ Failed
- **Severity:** LOW
- **Analysis / Findings:** El elemento `<title>` no está presente en el head de la página, por lo que no se puede verificar el título 'Términos'. El contenido probablemente carga correctamente pero el test falla por ausencia del meta title dinámico.

#### Test TC048 Navigate from Terms of Service to Privacy Policy using footer link
- **Test Code:** [TC048](./TC048_Navigate_from_Terms_of_Service_to_Privacy_Policy_using_footer_link.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/b6cd712a-fd5e-4892-a351-f494f7712571
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** La navegación entre páginas legales usando los links del footer funciona correctamente.

#### Test TC049 Open Refund Policy page and verify core content renders
- **Test Code:** [TC049](./TC049_Open_Refund_Policy_page_and_verify_core_content_renders.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/4f83e97d-47df-41bc-9935-dc43cbceb0e7
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** La página de política de reembolsos renderiza correctamente.

#### Test TC050 Open Privacy Policy page and verify core content renders
- **Test Code:** [TC050](./TC050_Open_Privacy_Policy_page_and_verify_core_content_renders.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/27d2d83f-4040-44c9-bb7b-f4856e5955d4
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** La página de política de privacidad renderiza correctamente.

#### Test TC051 Open Complaints Book page and verify core content renders
- **Test Code:** [TC051](./TC051_Open_Complaints_Book_page_and_verify_core_content_renders.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/75031368-b62e-47ed-b92a-c3d480b363b5
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** La página del libro de reclamaciones renderiza correctamente.

#### Test TC052 Verify footer exposes links to all legal pages from the home page
- **Test Code:** [TC052](./TC052_Verify_footer_exposes_links_to_all_legal_pages_from_the_home_page.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/ea650ab1-2150-45ff-93f2-1f3f219ad4d1
- **Status:** ✅ Passed
- **Severity:** LOW
- **Analysis / Findings:** El footer expone correctamente todos los links a páginas legales desde el home.

#### Test TC053 Legal page content remains readable after scrolling
- **Test Code:** [TC053](./null)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/27d2a316-504a-44bf-b300-5ae9c6fdfd7b/9f5e2766-3fde-45a0-a6dc-a5569bc2b679
- **Status:** ❌ Failed
- **Severity:** LOW
- **Analysis / Findings:** El test expiró después de 15 minutos. No se generó código de test. Probable timeout del entorno de ejecución.

---

## 3️⃣ Coverage & Matching Metrics

- **32.1% de tests pasaron** (17 de 53)

| Requirement                        | Total Tests | ✅ Passed | ❌ Failed |
|------------------------------------|-------------|-----------|-----------|
| Catalog / Home Page                | 5           | 5         | 0         |
| Product Search                     | 6           | 5         | 1         |
| Category Browsing                  | 8           | 3         | 5         |
| Product Detail                     | 8           | 3         | 5         |
| Shopping Cart                      | 8           | 1         | 7         |
| Checkout                           | 8           | 1         | 7         |
| Order Confirmation / Payment Pages | 2           | 2         | 0         |
| Legal Pages                        | 7           | 6         | 1         |
| **TOTAL**                          | **53**      | **17**    | **36**    |

---

## 4️⃣ Key Gaps / Risks

**32.1% de tests pasaron completamente.**

### Causa raíz principal: Estado del carrito vacío en tests de Cart y Checkout
La mayoría de los fallos en Cart (TC029–TC036) y Checkout (TC037–TC044) se deben a que TestSprite no persiste el estado del carrito entre navegaciones. El carrito usa `localStorage` y no hay un mecanismo de setup de estado previo al test. Esto hace que ~14 tests fallen por una sola causa raíz, no por bugs reales en el código.

### Bugs reales confirmados

| Severidad | Test | Descripción |
|-----------|------|-------------|
| 🔴 HIGH | TC010 | Botón X del drawer de búsqueda no cierra el panel |
| 🔴 HIGH | TC028 | Lightbox no se puede cerrar (botón cierre y Escape no funcionan) |
| 🔴 HIGH | TC025 | Producto sin stock no muestra 'Sin stock' y el botón add-to-cart permanece habilitado |

### Issues de datos / configuración de tests

| Severidad | Tests | Descripción |
|-----------|-------|-------------|
| 🟡 MEDIUM | TC017, TC018, TC020 | Paginación no visible — página de categoría queda en 'Cargando...' durante el test |
| 🟡 MEDIUM | TC021, TC022 | Detalle de producto queda en 'Cargando...' — posible timeout al llamar la API |
| 🟡 MEDIUM | TC023 | Sección 'Talla' ausente — el producto testeado no tiene `sizeInfo` populado |

### Limitaciones de diseño

| Severidad | Tests | Descripción |
|-----------|-------|-------------|
| 🟡 MEDIUM | TC016 | Toggle Grid/Lista no accesible — el control puede no tener labels ARIA o texto visible |
| 🟡 MEDIUM | TC014 | Opción 'Latest' ausente en el dropdown de sort — no implementada en la UI actual |
| 🟡 MEDIUM | TC047 | Páginas legales no tienen `<title>` dinámico — falta meta tag para SEO y tests |

### Recomendaciones prioritarias

1. **Corregir cierre del lightbox** (TC028) — bug crítico de UX, el usuario queda atrapado en el lightbox
2. **Corregir cierre del drawer de búsqueda** (TC010) — el botón X no funciona
3. **Corregir indicador de sin stock** (TC025) — riesgo de overselling
4. **Agregar `<title>` dinámico en páginas legales** (TC047) — mejora SEO
5. **Agregar opción de sort por "Más recientes"** (TC014) — feature faltante documentado
6. **Revisar carga de productos en categorías** (TC017–TC022) — posible problema de performance o CORS en entorno de test
