# LeafGenn — Automated Promotional Leaflet Generator

LeafGenn is a web-based system for generating promotional leaflet designs automatically.  
It streamlines the process of creating and managing retail promotional materials that were traditionally done manually by design teams.

---

## Overview

**LeafGenn** enables marketing or design teams to import promotional data, generate structured layouts, and export ready-to-print or digital promotional leaflets within minutes.

This project was developed as part of an academic research initiative on _automated content generation in retail promotion systems_.  
The system focuses on **efficiency**, **consistency**, and **reduced human error** in the design process.

---

## Core Features

- **Automated Leaflet Generation**  
  Upload an Excel file containing product data, and the system will automatically generate multi-page leaflet layouts based on predefined templates.

- **Visual Editor (Canva-like Interface)**  
  Users can visually adjust positions, fonts, and colors of product elements in a drag-and-drop environment.

- **Bank Gambar (Product Image Repository)**  
  Images are auto-matched with products via PLU codes, with optional manual upload directly from the editor.

- **History & Revisions**  
  All generated leaflets are saved with version control, allowing revisions and reloading previous projects.

- **Grid Cerdas (Smart Grid Layout)**  
  Uses _Association Rule Mining (Apriori)_ to identify product patterns and suggest optimal visual groupings.

- **Export Options**  
  Supports export in multiple formats: **PDF**, **PNG**, and **JPG** for print and digital distribution.

- **Role-Based Access Control (RBAC)**  
  Separate roles for _Designer_ and _Administrator_ with distinct access permissions.

---

## Testing

LeafGenn implements **Black Box Testing** and **automatic test scripting** to validate system functionality.  
Testing covers equivalence partitioning and boundary value analysis (BVA) for major modules such as authentication, upload, grid generation, and export.

---

## Installation (Development Mode)

> This setup guide is intended for local development only.  
> Production deployment instructions are intentionally omitted for security reasons.

### Prerequisites

- Node.js ≥ 18
- PHP ≥ 8.2
- Composer
- PostgreSQL ≥ 15
- Git

### Setup

1. Clone the repository:

```bash
git clone https://github.com/your-username/leafgenn.git
cd leafgenn
```

2. Install backend dependencies:

```bash
  cd backend
  composer install
  cp .env.example .env
  php artisan key:generate
```

3.  Install frontend dependencies::

```bash
  cd ../frontend
  npm install
  npm run dev
```

# Research Background

- _This project was developed under a research study focused on:_
- _Automation in visual content generation_
- _Agile single-developer methodology (Personal Extreme Programming / PXP)._
- _Application of Apriori algorithm in promotional layout optimization._
