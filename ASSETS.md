# Guía de assets para personajes

El sistema funciona como animación de recortes (cut-out): cada vista del personaje es un muñeco de piezas
que se superponen. La boca se mueve con el audio, la cabeza asiente, los brazos cambian de pose y,
para girar, se pasa por las vistas intermedias. Si los nombres siguen esta guía, el código encuentra
y arma todo solo, sin configuración extra.

## 1. Vistas: nombradas por ángulo

El nombre de la vista es hacia dónde apunta la nariz **en pantalla**, en grados. Se ignoran las
etiquetas "right/left" de las hojas, porque cambian de hoja a hoja.

| Vista | Qué es | Equivale en tus hojas |
|---|---|---|
| `000` | de frente | Front view |
| `045` | 3/4, nariz hacia la derecha de la pantalla | Right 3/4 front |
| `090` | perfil, mirando a la derecha | Right profile |
| `135` | 3/4 de espaldas, cabeza hacia la derecha | Right 3/4 back |
| `180` | de espaldas | Back view |
| `225` | 3/4 de espaldas, cabeza hacia la izquierda | Left 3/4 back |
| `270` | perfil, mirando a la izquierda | Left profile |
| `315` | 3/4, nariz hacia la izquierda | Left 3/4 front |

Un giro de `180` a `090` pasa solo por `135`, con 2–3 cuadros en cada vista intermedia y la cabeza
adelantándose un cuadro al cuerpo. Por defecto se toma el camino corto. Si quieres el largo, solo
dilo ("gira por el frente").

## 2. Cuántas vistas armar, por niveles

No todas las vistas necesitan piezas. Esto recorta el trabajo a menos de la mitad:

- **Nivel 1, vistas donde habla:** `000`, `045`, `315`. Van completas, con piezas y set de bocas.
- **Nivel 2, reacciones y perfiles:** `090`, `270`. Llevan piezas y un set de bocas reducido.
- **Nivel 3, solo para giros:** `135`, `180`, `225`. Una imagen plana (`full`), sin piezas, porque se ven
  2–3 cuadros o en planos donde nadie habla.
- La vista cenital (top-down) solo si una escena la pide.

**Espejo:** si el personaje es simétrico, `315` sale de `045` y `270` de `090` volteados, y no hay que
generarlos. Ojo: en el still que usé, Griff tiene una manga cyan y otra magenta, y en la hoja nueva las
dos son magenta. Define una versión oficial. Si las dos mangas son iguales, el espejo funciona. El logo
JS del dev no se puede espejar (se lee "SJ"), así que sus vistas a la izquierda van aparte.

## 3. Piezas por vista (niveles 1 y 2)

| Pieza | Nombre | Notas |
|---|---|---|
| Torso | `torso` | Con cuello, hombros y cuello de ropa, sin cabeza ni brazos |
| Cabeza | `head` | **Sin boca** (piel lisa donde va la boca) y sin cejas. Incluye cuernos, orejas, pelo y la parte de la barba que se mueve con la cabeza |
| Cejas | `brows` | Las dos juntas, en posición neutra. Las subo, bajo e inclino yo |
| Ojos | `eyes_open`, `eyes_closed` | Solo humanos y el perezoso, para parpadear. Griff no lleva (tiene lentes) |
| Brazo | `arm-l_upper`, `arm-l_lower` (igual con `arm-r`) | Partido en el codo. `l`/`r` = lado de la pantalla. Las poses las hago rotando las piezas, no con imágenes por pose |
| (perfil) | `arm-near`, `hand-near` | En `090`/`270` solo se ve un brazo |
| Mano | `hand-l_<forma>`, `hand-r_<forma>` | Una por forma, de la biblioteca de manos (sección 5) |
| Piernas | `leg-l`, `leg-r` | Solo para planos de cuerpo completo |
| Boca | `mouth_<forma>` | Ver sección 4 |

**Si el personaje ya está armado en Illustrator**, exporta un SVG por vista con cada pieza en su capa,
nombrada como arriba. Un solo archivo me da las piezas, su posición y el orden de capas.

Variantes de cabeza para gestos especiales, con sufijo: `head_sweat` (dev nervioso), `head_shock`, etc.

**Reglas que hacen que funcione:**

1. **Mismo lienzo para todo.** Todas las piezas y vistas de un personaje se exportan en el mismo tamaño
   de mesa de trabajo, con el personaje a la misma escala y la cintura a la misma altura. Así se apilan
   sin ajustar posiciones y cambiar de vista no "salta".
2. **Traslape en las uniones.** La cabeza trae un poco de cuello que se mete debajo del cuello de la
   ropa. El brazo trae el hombro completo, que se mete debajo o encima del torso. Sin esto se ven huecos
   cuando la cabeza asiente o el brazo gira.
3. **Fondo transparente**, sin sombras horneadas, sin texto ni números, sin marca de agua.
4. **Si exportas desde Illustrator, mejor SVG** con las capas nombradas igual que arriba (un SVG por
   vista). Es vector puro, aguanta cualquier close-up y conserva el orden de capas. Si exportas PNG,
   que sean de ~2000 px de alto.
5. **Pivotes (opcional):** en el SVG, un círculo pequeño en capas llamadas `pivot_neck`,
   `pivot_shoulder-l` y `pivot_shoulder-r`. Si no los pones, los calculo yo.

## 4. Set de bocas

Son las formas que usa el lipsync automático (Rhubarb). Van dibujadas en la misma posición del
lienzo, para que caigan justo sobre la cabeza.

| Forma | Sonido | Cómo se ve |
|---|---|---|
| `X` | silencio | Boca en reposo (la sonrisa de lado de Griff) |
| `A` | M, B, P | Labios cerrados y apretados |
| `B` | K, S, T, EE | Apenas abierta, dientes juntos |
| `C` | EH, AE | Abierta media, dientes de arriba |
| `D` | AA | Bien abierta, lengua visible |
| `E` | AO, ER | Abierta y algo redonda |
| `F` | OO, W | Labios en "o" pequeña |
| `G` | F, V | Dientes de arriba sobre el labio inferior |
| `H` | L | Abierta, lengua arriba |

- Niveles 1: las 9 formas.
- Perfiles (nivel 2): solo `X`, `A`, `C`, `D`, `F`. Las demás se mapean a esas.
- Para Griff de frente ya hay bocas en vector que funcionan. Si las tuyas salen mejor, las reemplazan.

## 5. Brazos y manos

Las poses (señalar, encogerse de hombros, levantar el índice) son ángulos en código: el hombro y el
codo rotan, y la mano cambia por la forma que pida el gesto. Lo que hace falta es esto:

- **Ángulos con Turntable:** cada forma se exporta como `hand_<forma>_<ángulo>` (por ejemplo `hand_peace_045`),
  con el ángulo de Turntable en tres dígitos; 000 es la palma de frente y 180 el dorso. Un script nombra
  artboards y vistas a partir del nombre que deja Turntable, así que basta con colocar cada vista en su artboard.
- **Biblioteca de manos** con nombres de forma: `fist`, `index-up`, `peace`, `three`, `rock`, `ok`,
  `relaxed`, `point` (señalando a cámara), `open-palm`. Las manos en reposo vistas desde distintos ángulos van como
  `relaxed_000`, `relaxed_045`, etc.
- **Muñeca en el mismo punto** en todos los archivos de mano. Al cambiar de mano no debe saltar.
- **Uniones redondeadas.** El extremo del brazo superior y del antebrazo termina en curva, se traslapa
  con la otra pieza y las dos tienen el mismo ancho en el codo.
- **Contorno como trazo vivo, no expandido.** El codo se limpia solo: dibujo los contornos de las dos
  piezas debajo y los rellenos encima, así que la línea del corte desaparece en cualquier ángulo. Por eso
  el contorno tiene que ser un trazo (stroke) y no una forma expandida. Los detalles internos (rayas del
  puño, pliegues) van en una subcapa `detail`, que se dibuja encima.
- **Pivotes:** si puedes, un círculo pequeño en capas `pivot_shoulder-l`, `pivot_elbow-l`,
  `pivot_wrist-l` (y `-r`), más `pivot_neck` y `pivot_hip`. Si no, los calculo por el traslape.
- **Piezas que no salen de rotar** (brazos cruzados, mano en el bolsillo, tecleando) van como una pieza
  aparte: `arms_crossed`, `arm-r_pocket`.

## 6. Props y fondos

- **Fondos vacíos**, sin personajes, en 9:16. Nombre: `bg_<lugar>` (`bg_meeting-room`, `bg_griff-desk`).
- **Objetos que tapan al personaje van aparte:** `bg_<lugar>_front` (el escritorio delante de Griff
  sentado), para que el personaje quede entre el fondo y esa capa.
- **Props:** `prop_<nombre>` (`prop_laptop`, `prop_tablet`, `prop_iceberg`).
- Lo que es gráfico de interfaz (tickets, dashboards, etiquetas, el board de tareas) **no lo generes**:
  lo hago en código y lo animo.

## 7. Estructura de carpetas

```
characters/
  griff/
    000/  torso.png  head.png  brows.png  arm-l_gesture.png  arm-r_pocket.png  mouth_A.png …
    045/  …
    090/  …
    180/  full.png
  pm/
  dev/
  sloth/
backgrounds/  bg_meeting-room.png  bg_meeting-room_front.png
props/        prop_tablet.png
```

## 8. Cómo dirigir una escena

Basta con texto normal. El script del Google Doc ya tiene el nivel de detalle necesario. Los tiempos
salen del audio, así que no tienes que poner segundos salvo para algo puntual. Ejemplo:

> Sala de juntas. Griff de espaldas mirando el board. Cuando el PM dice "one simple dashboard",
> Griff gira a perfil (090), mira al PM, luego gira a cámara (000) y sube una ceja: "Famous last words."

Eso se traduce en `180` → `135` → `090` (cabeza primero), pausa, `045` → `000`, y ceja arriba sincronizada
con la frase. Si falta una vista o una pose, te digo cuál antes de renderizar.
