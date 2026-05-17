# Desplegar ProducMarket (Render + GitHub)

Tu código está en: **https://github.com/hlahera/sistema-gestor-de-ventas**

## Paso único en Render (recomendado)

1. Entra en [dashboard.render.com](https://dashboard.render.com)
2. **New +** → **Blueprint**
3. Conecta el repo `sistema-gestor-de-ventas` (rama `main`)
4. Render detectará el archivo **`render.yaml`** en la raíz y creará:
   - **producmarket-db** — PostgreSQL
   - **producmarket-api** — Django (API)
   - **producmarket-web** — React (sitio estático)
5. Pulsa **Apply** y espera 10–15 minutos (plan gratuito).

Al terminar tendrás dos URLs públicas:

| Servicio | Uso |
|----------|-----|
| `https://producmarket-web.onrender.com` | Abre esta en el móvil (la app) |
| `https://producmarket-api.onrender.com` | API (el frontend ya la usa sola) |

### Crear usuario administrador

Cuando el API esté **Live**:

1. En Render → servicio **producmarket-api** → **Shell**
2. Ejecuta:
   ```bash
   python manage.py createsuperuser
   ```

### Plan gratuito

- El servicio se **apaga** tras inactividad; la primera carga puede tardar ~1 minuto.
- Las **fotos** subidas pueden perderse al redeployar (sin disco persistente en free). Para producción seria conviene disco o almacenamiento externo.

---

## Desarrollo local

```bash
# API
cd producmarket
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Web
cd producmarket-frontend-cra
cp .env.example .env.local
npm install
npm start
```

---

## Alternativa: Vercel (solo frontend) + Render (API)

Si prefieres Vercel para la web, despliega solo `producmarket-api` en Render y en Vercel configura:

- `REACT_APP_API_URL` = `https://producmarket-api.onrender.com/api`
- `REACT_APP_MEDIA_URL` = `https://producmarket-api.onrender.com`

Y en Render API añade la URL de Vercel en `CORS_ALLOWED_ORIGINS`.
