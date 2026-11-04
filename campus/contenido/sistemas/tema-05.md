## La placa base {alta}

La **placa base** (placa madre, *motherboard*, *mainboard*) es el **componente integrador**: **todo** se conecta a ella, tanto lo interno como lo externo (ratón, cascos, USB, HDMI…). Los conectores de la parte trasera de la torre son de la placa base.

- En los sobremesa suele ir en **vertical**; en los portátiles, en **horizontal**.
- De ella dependen en gran medida las **posibilidades, la velocidad y las prestaciones** del equipo.
- Todo va soldado a la **PCB** (*Printed Circuit Board*), la tarjeta roja, azul, verde o negra que hace de base.

**Formatos**:

- **XT** y **AT**: antiguos.
- **ATX**: el **más usado** hoy.
- **WTX**: para **servidores**.
- Diseños propietarios de cada fabricante.

También se clasifican por el **socket** del procesador o por el **chipset**.

## Componentes de la placa base {alta}

![Esquema de una placa base con sus partes numeradas](img/tema-05-placa-base.svg "Las partes que tienes que saber reconocer. Las ranuras de RAM del **mismo color** forman pareja para el Dual Channel (tema 6).")

### Chipset {alta}

«Conjunto de chips». Controla funciones como la **comunicación entre procesador y memoria**, la caché o los puertos.

En las **placas antiguas** se dividía en dos:

- **Northbridge (puente norte)**: controla lo **rápido** (RAM, gráfica integrada). Va **conectado directamente al procesador**.
- **Southbridge (puente sur)**: controla los **periféricos** y lo **lento**. Habla con el procesador **a través del Northbridge**.

> [!clave] Hoy el **Northbridge está integrado en el procesador**. El procesador y el chipset se comunican mediante el **DMI** (*Direct Media Interface*).

![Chipset antes, con Northbridge y Southbridge, y ahora, con el Northbridge dentro del procesador](img/tema-05-northbridge-southbridge.svg "Lo rápido (RAM y gráfica) va **directo al procesador**; lo lento pasa por el **chipset**.")

### Zócalos o ranuras {alta}

- **De memoria**: donde se insertan los módulos de **RAM**.
- **Del procesador (socket)**: donde va el procesador. **El procesador tiene que ser compatible con el socket** de la placa; por ejemplo, el socket 1151.

### Buses de expansión {alta}

Ranuras para **tarjetas** gráficas, de sonido, de red…

| Bus | Características |
|---|---|
| **ISA** | El **más antiguo**. **Obsoleto** |
| **PCI** | El **más extendido** y aún se usa. Destacó por su velocidad. De **Intel** |
| **AGP** | Solo para **tarjetas gráficas**. De **Intel** |
| **PCI-Express (PCIe)** | **Sustituye a PCI y a AGP**. Anchos **x1, x4, x8 y x16**. Aquí va hoy la gráfica |

> [!error] Confundir **PCI** con **PCIe**. Son buses distintos: PCIe sustituyó a PCI, y las placas actuales casi solo traen PCIe. El número (x1, x16…) indica cuántas **líneas** tiene la ranura: más líneas, más velocidad.

Conectores de vídeo de la tarjeta gráfica:

- **HDMI**: transmite **audio y vídeo**, digital.
- **VGA**: **solo vídeo**, analógico.
- **DVI**: **solo vídeo**, admite señal **digital y analógica**.

> [!nota] El PDF dice que HDMI y VGA solo admiten señal digital, pero **VGA es analógica**. Si en el examen preguntan cuál admite **ambas** señales, la respuesta es **DVI**.

### Controladores y conectores internos {alta}

- **IDE**: para discos duros y CD/DVD. **En desuso**.
- **SATA**: **sustituye a IDE** y tiene mejores prestaciones. Lo usan HDD y SSD. Muchas placas traen los dos.
- **M.2**: muy usado hoy para **discos SSD**. Es una tarjeta pequeña que se inserta directamente en la placa.

### BIOS y UEFI {alta}

- La **BIOS** (*Basic Input Output System*) es un **programa** que, **al arrancar**, comprueba que todos los componentes necesarios están bien instalados. Se ejecuta **solo una vez**, durante el arranque.
- Se guarda en una **memoria de solo lectura**: **ROM**, **EPROM** o **EEPROM**.
- Se usa desde los años 80 y en los equipos actuales la ha **reemplazado la UEFI**: la misma idea, pero mejorada en funciones y diseño. Por costumbre se sigue llamando «BIOS» a todo.

## El procesador {alta}

Es el «**cerebro**»: **ejecuta las instrucciones de los programas**. Tiene tres elementos:

- **Unidad de control**: **busca las instrucciones en la RAM**, las ejecuta y las procesa. Cuando necesita hacer cálculos llama a la ALU.
- **ALU (UAL)**: hace las operaciones **aritméticas** (+, −, ×, ÷) y **lógicas** (<, >, ≤…).
- **Registros internos**: pequeños almacenes de datos con acceso **prácticamente inmediato**.

### Características para elegir un procesador {alta}

- **Frecuencia de reloj** (Hz; hoy en **GHz**):
  - **Interna**: la velocidad a la que trabaja el procesador (2,4 GHz, 3 GHz…).
  - **Externa**: la velocidad a la que se comunica con la placa base. Cuanto **menor**, **más barata** es la placa.
- **Núcleos**: cada núcleo funciona como un **procesador independiente**: dual-core (2), quad-core (4), octa-core (8)… hasta 128.
- **Caché**: memoria **interna** del procesador, **más rápida pero más pequeña** que la RAM. Guarda los **datos usados más recientemente**. Se mide en **MB**.
  - **L1**: la **más rápida y la más pequeña**. Cuanto más grande, más caro el procesador.
  - **L2**: más lenta y más grande que la L1.
  - **L3** (y a veces L4): más lenta y más grande todavía.

> [!truco] **Registros, caché y RAM** son como tu **mano**, tu **bolsillo** y tu **mochila**: cuanto más cerca, más rápido coges las cosas, pero menos caben.

> [!ejemplo] Dos procesadores a **3 GHz**, uno con **4 núcleos** y otro con **8**. Un programa de 16 instrucciones (1 s cada una): el de 4 núcleos tarda **4 s** y el de 8 núcleos **2 s**.

> [!nota] El ejemplo supone que el programa puede **repartir** su trabajo entre los núcleos. Si un programa solo usa un núcleo, tener 8 no lo acelera.

> [!error] Elegir procesador mirando solo los GHz. Un procesador más rápido **no es necesariamente mejor**: hay que mirar también **núcleos** y **caché**.

El procesador debe ser **compatible con el socket y el chipset** de la placa. Los dos fabricantes actuales son **Intel** y **AMD**.

?? ¿Por qué la placa base es el componente integrador? || Porque todos los componentes, internos y externos, se conectan a ella y a través de ella se comunican.
?? ¿Qué es la PCB? || La Printed Circuit Board: la tarjeta base sobre la que va soldado todo lo de la placa.
?? ¿Qué formato de placa base es el más usado? ¿Y el de servidores? || ATX es el más usado; WTX es para servidores.
?? Diferencia entre Northbridge y Southbridge. || Northbridge: componentes rápidos (RAM, gráfica), conectado directamente al procesador. Southbridge: periféricos y funciones lentas, se comunica a través del Northbridge.
?? ¿Dónde está hoy el Northbridge y cómo se comunican procesador y chipset? || Integrado en el procesador; se comunican mediante el DMI (Direct Media Interface).
?? ¿Qué es el socket? || La ranura de la placa donde se inserta el procesador; el procesador debe ser compatible con él.
?? Ordena y describe los buses ISA, PCI, AGP y PCIe. || ISA (el más antiguo, obsoleto); PCI (el más extendido); AGP (solo gráficas); PCIe (sustituye a PCI y AGP, anchos x1, x4, x8 y x16).
?? ¿Qué transmite cada conector: HDMI, VGA y DVI? || HDMI: audio y vídeo. VGA: solo vídeo (analógico). DVI: solo vídeo, digital y analógico.
?? ¿Qué sustituyó a IDE? ¿Qué conector usan hoy muchos SSD? || SATA sustituyó a IDE; muchos SSD usan M.2 (o SATA).
?? ¿Qué hace la BIOS y dónde se guarda? || Al arrancar comprueba que todos los componentes están bien instalados; se ejecuta una sola vez y se guarda en memoria de solo lectura (ROM, EPROM, EEPROM).
?? ¿Qué ha reemplazado a la BIOS? || La UEFI: la misma idea, mejorada en funciones y diseño.
?? ¿Cuáles son los tres elementos del procesador? || Unidad de control, ALU y registros internos.
?? ¿Qué diferencia hay entre la frecuencia interna y la externa? || La interna es la velocidad del procesador; la externa, la de comunicación con la placa base (cuanto menor, más barata la placa).
?? ¿Qué es un núcleo? || Una parte del procesador que funciona como un procesador independiente.
?? ¿Qué guarda la caché y qué nivel es más rápido? || Los datos usados más recientemente. La L1 es la más rápida y la más pequeña.
?? ¿Por qué no basta con mirar los GHz para elegir procesador? || Porque el rendimiento también depende del número de núcleos y de la caché.
?? ¿Qué diferencia hay entre PCI y PCIe? || Son buses distintos: PCIe (PCI-Express) sustituyó a PCI y a AGP; las placas actuales casi solo traen PCIe.
