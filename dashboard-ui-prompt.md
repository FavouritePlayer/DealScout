# UI Generation Prompt: SaaS E-commerce Admin Dashboard

Use this as a base prompt for tools like v0, Lovable, Galileo AI, Figma AI, or Claude itself. Swap the `[PAGE NAME]` and `[PAGE-SPECIFIC CONTENT]` sections to generate additional pages that stay visually consistent with the dashboard.

---

## Base Prompt

Design a modern, clean SaaS admin dashboard for an e-commerce management platform called "[STORE NAME]". The aesthetic is minimal, airy, and premium — soft and approachable rather than dense or corporate.

**Overall layout**
A fixed left sidebar (~220px) on a white card floating over a very subtle pastel gradient background (soft pink fading to soft green/mint, barely-there, almost white). The whole dashboard sits as a single large rounded-corner card (24px radius) with a soft drop shadow, slightly inset from the browser edges. A top bar spans the main content area only (not the sidebar).

**Sidebar**
- Top: small circular logo/avatar + store name + a "Pro" pill badge, plus a "Private" subtitle below it
- "MENU" section label in uppercase, small, muted gray, letter-spaced
- Nav items with icons: Dashboard (active state — solid black rounded-pill background, white text/icon), Products, Orders & Invoices, Sales Analytics, Customer Insights, Reports
- Inactive items: gray icon + text, small colored notification badges (orange circles with numbers) next to some items
- "OTHERS" section label, then: Settings, Team Members, Help Center, Logout
- Bottom: user profile row with avatar, name, email, and a small overflow menu icon

**Top bar**
- Breadcrumb (e.g. "Store Name > Dashboard") and a large "Welcome Back, [Name] 👋" greeting below it
- Centered search bar with icon and "⌘S" keyboard shortcut hint
- Right side: icon buttons (theme toggle, notifications bell), a stack of overlapping circular avatar icons with a "+6" overflow, and a dark pill-shaped "Invite" button

**Main content grid (2-column, roughly 65/35 split)**

*Left column, top card — "Total Profit Overview"*
A large card with a month dropdown selector and overflow menu. Big dollar figure (e.g. "$110,450") with a small green percentage-change badge ("+$10,250 ↗ Compare to last month"). Below it, a smooth area/bar hybrid chart across months (Jan–Jul) with soft green bars, small inline percentage tags floating above bars (some green/positive, one red/negative), and a dark floating tooltip card showing a date and 3 stat rows when hovering one bar. Include a 3D-ish dark phone/device mockup illustration subtly integrated into the chart as a design flourish.

*Left column, bottom — "Recent Transaction" table*
A card with a search icon, category filter dropdown, sort icon, and an "Export" button (outlined, top right). Table columns: checkbox, Order ID, Product Name (with small thumbnail), Date & Time, Customer (avatar + name), Price, Status (pill badges: green "Completed", red "Cancelled", yellow/orange "Pending"). Clean row dividers, generous row padding, alternating subtle hover state.

*Right column, top — "Sales Performance"*
A card with a large semicircular radial/gauge chart made of segmented green bars fanning out, showing "80% Sales Goal" centered inside the arc. Below the gauge: a small legend (Highest Day / Lowest Day / Average dots) and two stat blocks side by side (Sales Number with % change, Total Revenue with % change). A dark pill banner at the bottom: "Your daily customer has increased" with a small icon.

*Right column, middle — "Top Market"*
A compact card listing countries with flag icons, country name, dollar amount, and a green percentage pill on the right (e.g. Indonesia $52,100 60%, Germany $24,500 25%, Italy $15,500 10%).

*Right column, bottom — "Top Product"*
Two side-by-side product tiles, each with a dark rounded-square product thumbnail/icon, product name, and sales count with a green up-arrow percentage.

**Design system**
- Colors: white/off-white card backgrounds, near-black (#0E0E0E–#1A1A1A) for primary text and active/dark UI elements, a vivid green accent (#16A34A-ish) for positive metrics and the active chart, soft red/orange for negative metrics and pending states, gray-400/500 for muted text and icons
- Typography: a clean modern sans-serif (Inter, Geist, or similar) — bold/semibold for headings and key numbers, regular/medium for body text, generous letter-spacing on uppercase labels
- Corner radius: large and consistent — 16–24px on cards, fully rounded (pill) on buttons, badges, and the active nav item
- Shadows: very soft, diffused, low-opacity drop shadows on cards — never harsh
- Spacing: generous padding inside cards (24–32px), clear visual hierarchy, lots of breathing room
- Icons: thin-stroke, minimal line icons throughout (sidebar nav, top bar, card actions)
- Micro-interactions implied: pill-shaped status badges, small colored percentage tags, rounded checkboxes

Build this as a responsive, component-based layout (cards, table, sidebar nav, top bar are all distinct reusable components).

---

## Extending to Other Pages

Reuse the same sidebar, top bar, color system, typography, card style, and corner radius/shadow rules from the base prompt above. Only change the main content grid per page. Append one of these blocks to the base prompt:

**Products page**
> Replace the main content with a Products page: a top toolbar (search, category filter, sort, "Add Product" button), then a grid or table of products showing thumbnail, name, SKU, category, stock level (with a low-stock warning pill), price, and status (Active/Draft/Out of Stock pill). Include a stats row at the top (Total Products, Low Stock, Out of Stock, Total Inventory Value) as small cards matching the dashboard's stat-card style.

**Orders & Invoices page**
> Replace the main content with an Orders & Invoices page: filter tabs (All, Pending, Completed, Cancelled, Refunded), a search bar, and a table of orders (Order ID, customer avatar + name, items count, date, total, payment status pill, fulfillment status pill, and an actions menu). Include a summary row of stat cards (Total Orders, Revenue This Month, Pending Orders, Refund Rate).

**Sales Analytics page**
> Replace the main content with a Sales Analytics page: a larger primary line/area chart (Revenue Over Time) with date-range selector, plus a 2x2 grid of supporting charts/cards below — Sales by Category (donut chart), Sales by Channel (bar chart), Conversion Rate (line + percentage), and Average Order Value (stat + sparkline). Keep the same green-accent, soft-shadow card styling.

**Customer Insights page**
> Replace the main content with a Customer Insights page: top stat cards (Total Customers, New This Month, Returning Rate, Avg. Lifetime Value), a customer growth line chart, and a customer table (avatar, name, email, total orders, total spent, last order date, a small loyalty/segment tag).

**Reports page**
> Replace the main content with a Reports page: a list of report cards (Sales Report, Inventory Report, Customer Report, Financial Report), each showing a small preview chart, last-generated date, and "Download" / "Generate" buttons, laid out in a clean grid matching the dashboard's card style.

**Settings page**
> Replace the main content with a Settings page: a left-aligned vertical tab list (Profile, Store Details, Team, Billing, Notifications, Security) and a right content panel with form fields, toggles, and a "Save Changes" button, all using the same rounded-input, pill-button styling as the rest of the dashboard.
