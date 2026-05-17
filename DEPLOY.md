# Desplegar ProducMarket en internet

La app tiene **dos partes** que debes publicar por separado:

| Parte | Carpeta | Ejemplo de hosting |
|-------|---------|-------------------|
| **API (Django)** | `producmarket/` | [Render](https://render.com) (gratis con límites) |
| **Web (React)** | `producmarket-frontend-cra/` | [Vercel](https://vercel.com) o [Netlify](https://netlify.com) |

---

## 1. Backend en Render

1. Sube el repo a **GitHub**.
2. En Render: **New → Web Service** → conecta el repo.
3. Configuración:
   - **Root Directory:** `producmarket`
   - **Build Command:** `./build.sh`
   - **Start Command:** `gunicorn core.wsgi:application --bind 0.0.0.0:$PORT`
   - **Instance type:** Free (o de pago si necesitas más)

4. Variables de entorno (Environment):

   | Variable | Valor ejemplo |
   |----------|----------------|
   | `DEBUG` | `false` |
   | `SECRET_KEY` | *(genera una clave larga aleatoria)* |
   | `ALLOWED_HOSTS` | `producmarket-api.onrender.com` |
   | `CORS_ALLOWED_ORIGINS` | `https://tu-app.vercel.app` |
   | `CSRF_TRUSTED_ORIGINS` | `https://tu-app.vercel.app,https://producmarket-api.onrender.com` |
   | `SECURE_SSL_REDIRECT` | `true` |
   | `SERVE_MEDIA` | `true` |

5. **Disco persistente** (recomendado para fotos de productos): en Render añade un Disk montado en `media` (1 GB suele bastar al inicio). Puedes usar el blueprint `producmarket/render.yaml`.

6. **PostgreSQL** (recomendado en producción): crea una base **PostgreSQL** en Render y enlaza `DATABASE_URL` al servicio web. Sin esto se usa SQLite (en plan gratis el archivo puede perderse al reiniciar).

7. Tras el deploy, crea un admin:
   ```bash
   # En Render → Shell del servicio
   python manage.py createsuperuser
   python manage.py migrate
   ```

Anota la URL del API, por ejemplo: `https://producmarket-api.onrender.com`

---

## 2. Frontend en Vercel

1. **New Project** → importa el mismo repo de GitHub.
2. **Root Directory:** `producmarket-frontend-cra`
3. **Framework:** Create React App
4. Variables de entorno (antes del build):

   | Variable | Valor |
   |----------|--------|
   | `REACT_APP_API_URL` | `https://producmarket-api.onrender.com/api` |
   | `REACT_APP_MEDIA_URL` | `https://producmarket-api.onrender.com` |

5. Deploy. La URL será algo como `https://producmarket.vercel.app`.

6. Vuelve a Render y pon esa URL exacta en `CORS_ALLOWED_ORIGINS` y `CSRF_TRUSTED_ORIGINS`.

---

## 3. Probar desde el móvil

Abre en el navegador del teléfono la URL de Vercel (`https://...`). Debe cargar el login y conectar con el API por HTTPS.

---

## Desarrollo local (sin cambios)

```bash
# Terminal 1 – API
cd producmarket
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Terminal 2 – Web
cd producmarket-frontend-cra
cp .env.example .env.local
npm install
npm start
```

---

## Copias de seguridad

En producción guarda periódicamente:

- Base de datos (PostgreSQL desde Render, o copia de `db.sqlite3` si usas SQLite)
- Carpeta `producmarket/media/` (imágenes de productos)

---

## Checklist rápido

- [ ] `DEBUG=false` en el servidor
- [ ] `SECRET_KEY` única y secreta
- [ ] CORS solo con la URL del frontend
- [ ] `REACT_APP_*` configuradas en Vercel **antes** del build
- [ ] Superusuario creado en el servidor
- [ ] Disco persistente o PostgreSQL para no perder datos
