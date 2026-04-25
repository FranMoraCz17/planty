# Plant Project - Apunte de avance

Este README lo estoy usando como si fuera el documento para Notion de esta parte del curso. La idea no es dejarlo super formal, sino que sirva para explicar que se hizo, que falta y por que las pantallas quedaron asi.

## 1. Contexto rapido

Parti de la pantalla de perfil que ya teniamos hecha al inicio. A partir de ese estilo se fueron agregando otras pantallas a la navegacion:

- Inicio
- Mis plantas
- Identificar
- Cuidado
- Perfil
- Login
- Registro

La app sigue siendo una propuesta de una aplicacion para cuidado de plantas. El enfoque actual no es que todo funcione con datos reales todavia, sino dejar bien pensado el flujo visual y la estructura para conectar base de datos despues.

## 2. Simulacion del ejercicio con varias IAs

Para cumplir con la consigna, simule el proceso de pedirle a varias IAs nuevas pantallas usando como referencia la pantalla de perfil. La idea fue comparar como resuelven una misma necesidad visual.

### IAs comparadas

- ChatGPT
- Gemini
- Copilot

### Lo que note en general

Las tres me daban ideas parecidas: cards, botones verdes, iconos de plantas, estadisticas, listas y CTAs. Lo que mas cambiaba era el orden de la informacion y cuanto "llenaban" la pantalla.

### Pros vs contras

| IA | Pros | Contras |
| --- | --- | --- |
| ChatGPT | Suele mantener bastante bien el mismo lenguaje visual entre pantallas. Propone textos y componentes faciles de reutilizar. | A veces deja todo demasiado limpio o generico, y varias pantallas se parecen mucho entre si. |
| Gemini | Tira opciones mas variadas y a veces mete bloques mas utiles para una app real. | En algunos casos agrega demasiada informacion para una sola pantalla y se siente cargada. |
| Copilot | Piensa mucho en componentes y en como llevarlo a codigo rapido. | Visualmente no siempre se siente tan consistente; a veces resuelve mas como "pantalla funcional" que como producto. |

### Con cual me quedaria

Si tuviera que escoger una sola para seguir iterando el estilo, me quedaria con ChatGPT para direccion visual base y con Copilot para bajar esa idea a codigo. Gemini lo veo util para sacar variaciones y no quedarse con la primera solucion.

## 3. Componentes que se repiten entre pantallas

Revisando la pantalla de perfil y las nuevas pantallas, se repiten mucho estos patrones:

- Header simple con titulo y texto de apoyo.
- Cards con fondo claro, borde suave y radio mediano/grande.
- Boton principal verde para la accion mas importante.
- Iconos circulares para resaltar una accion o categoria.
- Listas o filas con informacion resumida.
- Segmentos o tabs internos para cambiar de vista.
- Texto dividido en tres niveles: titulo, cuerpo y caption.

Esto esta bien porque da sensacion de sistema y no de pantallas sueltas.

## 4. Patron visual y correcciones que haria

En general si hay patron. La aplicacion se siente consistente por estas razones:

- Se repite la paleta verde con fondos claros.
- Casi todas las pantallas usan cards con borde.
- La separacion entre bloques usa el mismo espaciado.
- Los botones principales conservan la misma forma.

Pero si haria algunas correcciones:

- Hay radios que a veces se ven medio distintos entre componentes y se pueden unificar mas.
- Algunos bloques usan demasiados tonos de apoyo; conviene reducir un poco para que el foco siga siendo el contenido.
- El color `accentWarm` con texto o iconos blancos puede dar problemas de contraste en ciertos casos.
- Hay pantallas que todavia estan en modo "estructura base", entonces cuando entren datos reales habra que revisar estados vacios, errores y carga.

## 5. Puntos importantes de accesibilidad

Lo que veo mas importante para esta app:

- Botones y zonas tocables de buen tamano. La base ya va por ahi porque varios botones tienen altura minima decente.
- Contraste entre texto y fondo. En verdes principales va bien, pero en acentos calidos hay que revisar mejor.
- No depender solo del color para comunicar estado. Ejemplo: prioridad alta, media o baja deberia tener texto o icono, no solo color.
- Inputs claros y faciles de entender en login y registro.
- Labels de accesibilidad en botones e iconos importantes.
- Orden visual simple, porque una persona comun no va a leer todo; va a escanear la pantalla.

## 6. Pensando como una persona comun usaria la app

Si me pongo en el lugar de alguien normal, no pisaria la app pensando en "modulos" ni en "navegacion". Lo haria mas o menos asi:

1. Entro y espero registrarme o iniciar sesion sin enredarme.
2. Quiero ver rapido mis plantas.
3. Si una planta se ve rara, intentaria tomar una foto o buscar el problema.
4. Esperaria que la app me diga cuando regar o revisar algo.
5. Tambien esperaria ver historial, aunque sea simple.

O sea: la persona va por tareas concretas, no por exploracion tecnica. Por eso el flujo tiene que ser directo.

## 7. Explicacion a alguien no programador

Hice el ejercicio como si se la explicara a mis papas o a un hermano:

> "Es una app para guardar tus plantas, saber donde las tienes, cuando regarlas y ayudarte a identificar si algo anda mal."

Lo que probablemente me dirian o esperarian:

- "Quiero ver fotos de mis plantas."
- "Que me diga facil si hoy tengo que regar algo."
- "Si tomo una foto, quiero que me diga que planta es o que problema tiene."
- "Que no sea complicado meter una planta nueva."
- "Si cambio de celular, esperaria no perder todo."

Eso ultimo ya toca directamente el tema de base de datos y cuenta de usuario.

## 8. Pantallas creadas para esta parte

En esta entrega deje listas las pantallas de:

- Login
- Registro

Se integraron al flujo con `expo-router` y ahora la app arranca por autenticacion antes de entrar a las tabs.

## 9. Que pasa en cada pantalla pensando en base de datos

### Login

- El usuario escribe correo y contrasena.
- Luego esto deberia validar credenciales contra una tabla o servicio de autenticacion.
- Si sale bien, se carga su perfil y su coleccion.

### Registro

- Se capturan nombre, correo y contrasena.
- Despues deberia crearse el usuario y una configuracion inicial.
- Tambien podria guardar preferencias basicas desde el inicio.

### Inicio

- Resume lo importante: accesos, pulso del jardin, entradas rapidas.
- Aqui despues vendrian datos agregados del usuario: proximos riegos, alertas, plantas destacadas.

### Mis plantas

- Deberia listar la coleccion real del usuario.
- Tambien agrupar por espacios, categorias o estado.
- A futuro necesita CRUD completo: crear, leer, editar y eliminar plantas.

### Identificar

- Es la puerta para subir foto o abrir camara.
- A futuro necesita guardar imagen, resultado de identificacion, fecha y relacionarlo con una planta o con una consulta aislada.

### Cuidado

- Agrupa recordatorios, historial de diagnosticos y enfermedades comunes.
- Necesita datos programados, historial y posiblemente recomendaciones por planta.

### Perfil

- Muestra datos del usuario, estadisticas y ajustes.
- Luego deberia guardar configuracion de tema, notificaciones, foto y datos de cuenta.

## 10. Cosas que ya se entienden mejor despues de este ejercicio

- No basta con que la pantalla se vea bonita; tiene que dejar claro que accion sigue.
- Varias pantallas comparten una misma base visual, asi que conviene seguir trabajando por componentes reutilizables.
- Login y registro no eran "extra", en realidad ayudan a ordenar desde ya como se pensaria la base de datos.
- La app ya insinua varias entidades importantes: usuario, planta, ubicacion, recordatorio, diagnostico, foto y preferencia.

## 11. Posible estructura de datos mas adelante

Sin ponerme todavia a modelar full, las entidades que mas se notan son:

- `users`
- `plants`
- `locations`
- `care_reminders`
- `diagnosis_history`
- `photos`
- `user_preferences`

## 12. Cierre corto

En resumen, la app ya tiene una linea visual bastante clara y las pantallas nuevas no se sienten fuera de lugar. Lo mas importante de esta parte fue dejar listas `login` y `register`, revisar que patron comparten con perfil y pensar con mas sentido que necesitara la app cuando entre una base de datos real.

## 13. Como correrlo

```bash
npm install
npm run start
```

La ruta inicial ahora cae en `/(auth)/login`.
